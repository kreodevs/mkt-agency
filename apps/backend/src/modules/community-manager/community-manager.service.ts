import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { runWithLlmUsageContext } from '../../shared/ai/llm-usage.context';
import { TenantEntity } from '../tenant/infrastructure/typeorm/tenant.entity';
import { ContentService } from '../content/content.service';
import { ImageGenerationService } from '../agents/image-generation.service';
import { TalkingHeadPostComposerService } from './talking-head-post-composer.service';
import { VisualTemplateComposerService } from './visual-template-composer.service';
import {
  buildMediaKitRevisionHint,
  feedbackRequestsAiImage,
  feedbackRequestsMediaKit,
  parseFeedbackTargetFrames,
} from './domain/feedback-visual-intent.util';
import { enrichVisualDescriptionForAi } from './domain/visual-prompt-enrichment.util';
import { resolveVisualBrandKit } from './domain/visual-brand-kit.util';
import { kitHasComposeImageRoles } from '../product/domain/product-media-kit.constants';
import { ProductService } from '../product/product.service';
import { ProductAppCaptureService } from '../product/product-app-capture.service';
import {
  normalizeContentVisualFormat,
  visualFormatToFrameCount,
} from '../content/domain/content-visual-format.util';
import {
  SOCIAL_COPY_ADAPTER,
  SocialCopyAdapterPort,
  SocialCopyPost,
} from './adapters/social-copy.adapter.port';
import { CommunityManagerBatchEntity } from './infrastructure/typeorm/community-manager-batch.entity';
import {
  DEFAULT_CM_PLATFORMS,
  DEFAULT_CM_POST_COUNT,
  CM_PLATFORMS,
  type CmPlatform,
} from './domain/cm-platforms.constants';
import {
  CM_AUTO_WEEKLY_GENERATION_KEY,
  isAutoWeeklyGenerationEnabled,
  readCommunityManagerSettings,
} from './domain/copilot-generation-settings.util';
import {
  CommunityManagerPreferencesResponse,
  CommunityManagerReadinessResponse,
  GenerateResponse,
  SocialCopyBatchResponse,
} from './dto/community-manager.response.dto';
import {
  GenerateSocialCopyDto,
  UpdateCommunityManagerPreferencesDto,
} from './dto/community-manager.request.dto';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { CreateContentDto } from '../content/dto/content.request.dto';
import { sanitizeVisualPromptForArt } from '../content/domain/visual-prompt.util';
import { resolveContentImageDestination, socialCopyPostFromContent } from './domain/content-visual-design.util';
import { resolveStoredVisualScene } from './domain/visual-scene.util';
import { isAiArtTemplateId } from './domain/visual-template.constants';
import {
  isVisualDesignPresetId,
  isVisualTemplateId,
} from './domain/visual-brand-kit.util';
import type { VisualTemplateId } from './domain/visual-template.constants';
import { sanitizePublishableCopy } from '../../shared/domain/sanitize-publishable-copy.util';
import { toLocalDateKey } from '../../shared/domain/date-key.util';
import {
  GenerationContextFacade,
  type GenerationContext,
} from './generation-context.facade';
import { ArtKitComposeService } from './art-prompt-library/art-kit-compose.service';
import { ArtPromptSelectorService } from './art-prompt-library/art-prompt-selector.service';
import { SceneKitComposeService } from './art-prompt-library/scene-kit-compose.service';
import {
  shouldSkipTemplateForCreativeScene,
  shouldUseCreativeScene,
  wantsProductScreenShowcase,
} from './art-prompt-library/scene-routing.util';
import {
  resolveVisualIntent,
  shouldUseArtKitCompose,
  shouldUseArtPromptLibrary,
} from './art-prompt-library/visual-intent.util';
import { CmCharacterService } from './cm-character.service';

@Injectable()
export class CommunityManagerService {
  private readonly logger = new Logger(CommunityManagerService.name);

  constructor(
    @InjectRepository(CommunityManagerBatchEntity)
    private readonly batches: Repository<CommunityManagerBatchEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(ContentEntity)
    private readonly contents: Repository<ContentEntity>,
    @Inject(SOCIAL_COPY_ADAPTER)
    private readonly adapter: SocialCopyAdapterPort,
    private readonly llmProviders: LlmProviderService,
    private readonly contentService: ContentService,
    private readonly imageGeneration: ImageGenerationService,
    private readonly templateComposer: VisualTemplateComposerService,
    private readonly talkingHeadComposer: TalkingHeadPostComposerService,
    private readonly productService: ProductService,
    private readonly productAppCaptureService: ProductAppCaptureService,
    private readonly contextFacade: GenerationContextFacade,
    private readonly artPromptSelector: ArtPromptSelectorService,
    private readonly artKitCompose: ArtKitComposeService,
    private readonly sceneKitCompose: SceneKitComposeService,
    private readonly cmCharacter: CmCharacterService,
  ) {}

  async getPreferences(tenantId: string): Promise<CommunityManagerPreferencesResponse> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException({ error: 'Tenant not found', code: 'NOT_FOUND' });
    }

    const stored = readCommunityManagerSettings(tenant.settings);
    const platforms = this.normalizePlatforms(stored.platforms);
    const count =
      typeof stored.count === 'number' && stored.count >= 1 && stored.count <= 6
        ? stored.count
        : DEFAULT_CM_POST_COUNT;

    return {
      platforms,
      count,
      autoWeeklyGenerationEnabled: isAutoWeeklyGenerationEnabled(tenant.settings),
    };
  }

  async updatePreferences(
    tenantId: string,
    dto: UpdateCommunityManagerPreferencesDto,
  ): Promise<CommunityManagerPreferencesResponse> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException({ error: 'Tenant not found', code: 'NOT_FOUND' });
    }

    const stored = readCommunityManagerSettings(tenant.settings);
    const platforms = this.normalizePlatforms(dto.platforms);
    const count = dto.count ?? DEFAULT_CM_POST_COUNT;
    const autoWeeklyGenerationEnabled =
      dto.autoWeeklyGenerationEnabled ??
      (stored[CM_AUTO_WEEKLY_GENERATION_KEY] === true);

    tenant.settings = {
      ...tenant.settings,
      communityManager: {
        ...stored,
        platforms,
        count,
        [CM_AUTO_WEEKLY_GENERATION_KEY]: autoWeeklyGenerationEnabled,
      },
    };
    await this.tenants.save(tenant);

    return { platforms, count, autoWeeklyGenerationEnabled };
  }

  async getReadiness(tenantId: string): Promise<CommunityManagerReadinessResponse> {
    const ctx = await this.contextFacade.buildGenerationContext(tenantId, {});
    const productReady = this.isProductReadyForCM(ctx.productContext);

    const items = [
      {
        key: 'product',
        label: 'Producto a promocionar',
        description: 'Define qué vendes: descripción y audiencia del producto principal.',
        complete: productReady,
        href: '/products',
      },
      {
        key: 'companyName',
        label: 'Nombre de empresa',
        description: 'Identidad básica para contextualizar el copy.',
        complete: !!ctx.resolvedProfile?.companyName?.trim(),
        href: '/onboarding',
      },
      {
        key: 'industry',
        label: 'Industria / sector',
        description: 'Ayuda a elegir temas y referencias del mercado.',
        complete: !!ctx.resolvedProfile?.industry?.trim(),
        href: '/onboarding',
      },
      {
        key: 'brandVoice',
        label: 'Voz de marca',
        description: 'Define estilo, registro y personalidad del contenido.',
        complete: !!ctx.resolvedProfile?.brandVoice?.trim(),
        href: '/onboarding',
      },
      {
        key: 'targetAudienceDesc',
        label: 'Audiencia objetivo',
        description: 'Permite adaptar mensajes y CTAs por segmento.',
        complete: !!ctx.resolvedProfile?.targetAudienceDesc?.trim(),
        href: '/onboarding',
      },
      {
        key: 'objectives',
        label: 'Objetivos de marketing',
        description: 'Orienta la estrategia detrás de cada publicación (recomendado).',
        complete: (ctx.resolvedProfile?.objectives?.length ?? 0) > 0,
        href: '/onboarding',
      },
    ];

    const completed = items.filter((item) => item.complete).length;
    return { completed, total: items.length, items };
  }

  private normalizePlatforms(value: unknown): CmPlatform[] {
    if (!Array.isArray(value)) {
      return [...DEFAULT_CM_PLATFORMS];
    }
    const allowed = new Set<string>(CM_PLATFORMS);
    const normalized = value.filter(
      (item): item is CmPlatform => typeof item === 'string' && allowed.has(item),
    );
    return normalized.length > 0 ? normalized : [...DEFAULT_CM_PLATFORMS];
  }

  private isProductReadyForCM(
    product: GenerationContext['productContext'],
  ): boolean {
    if (!product) return false;
    const hasDescription = !!(product.description?.trim() || product.valueProposition?.trim());
    const hasAudience = !!product.targetAudience?.trim();
    return hasDescription && hasAudience;
  }

  private async savePostsAsContent(
    tenantId: string,
    userId: string,
    posts: SocialCopyPost[],
    dto: GenerateSocialCopyDto,
    ctx: GenerationContext,
  ): Promise<{ publishedPosts: string[]; imagesAttached: number }> {
    const publishedPosts: string[] = [];
    let imagesAttached = 0;
    const recentRecipeIds: string[] = [];
    const today = new Date();
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      try {
        const content = await this.saveSinglePost(
          tenantId, userId, post, dto, ctx.effectiveProductId, today, i,
        );
        post.contentId = content.id;
        publishedPosts.push(content.id);

        if (dto.attachImages === false) continue;
        const attached = await this.attachVisualForPost(
          tenantId, userId, content.id, post, ctx.effectiveProductId, ctx.kit, i, ctx, recentRecipeIds,
        );
        if (attached) imagesAttached += 1;
        if (post.artRecipeId && !recentRecipeIds.includes(post.artRecipeId)) {
          recentRecipeIds.push(post.artRecipeId);
        }
      } catch (err) {
        this.logger.warn(`Failed to save post "${post.title}" as content: ${err}`);
      }
    }
    return { publishedPosts, imagesAttached };
  }

  private async saveSinglePost(
    tenantId: string,
    userId: string,
    post: SocialCopyPost,
    dto: GenerateSocialCopyDto,
    effectiveProductId: string | undefined,
    today: Date,
    index: number,
  ) {
    const contentDto = new CreateContentDto();
    contentDto.title = post.title;
    contentDto.type = 'social';
    contentDto.body = this.formatPostBody(post);
    contentDto.campaignId = dto.campaignId;
    contentDto.productId = effectiveProductId;
    const scheduleDate = new Date(today);
    scheduleDate.setDate(scheduleDate.getDate() + index);
    contentDto.scheduledDate = toLocalDateKey(scheduleDate);
    contentDto.platform = post.platform;
    contentDto.visualFormat = post.visualFormat;
    contentDto.visualPrompt = sanitizeVisualPromptForArt(post.visualDescription, post.body) || null;
    contentDto.visualTemplateId = isVisualDesignPresetId(post.visualTemplateId)
      ? post.visualTemplateId
      : null;
    contentDto.visualScene = resolveStoredVisualScene(post);
    contentDto.visualHeadline = post.visualHeadline ?? null;
    contentDto.visualSubline = post.visualSubline ?? null;
    contentDto.visualCta = post.visualCta ?? null;
    contentDto.imageDestination = resolveContentImageDestination(post);
    return this.contentService.create(tenantId, userId, contentDto);
  }

  private handleGenerationError(error: unknown, batch: CommunityManagerBatchEntity): never {
    const message = this.extractErrorMessage(error);

    this.logger.error(`Social copy generation failed: ${message}`);
    batch.errorMessage = message;
    this.batches.save(batch);

    if (error instanceof BadRequestException) {
      throw error;
    }

    throw new BadRequestException({
      error: `No se pudo generar copy: ${message}. Revisa Ajustes → Proveedores LLM.`,
      code: 'CM_GENERATION_FAILED',
    });
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof BadRequestException) {
      return (error.getResponse() as { error?: string })?.error ?? error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Generation failed';
  }

  async list(tenantId: string): Promise<SocialCopyBatchResponse[]> {
    const items = await this.batches.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return items.map((item) => this.toResponse(item));
  }

  async generate(
    tenantId: string,
    userId: string,
    dto: GenerateSocialCopyDto,
  ): Promise<GenerateResponse> {
    this.validatePlatforms(dto.platforms);
    if (dto.productId) {
      await this.productAppCaptureService
        .ensureScreenshotsBeforeGenerate(tenantId, dto.productId)
        .catch((error) => {
          this.logger.warn(
            `Auto-captura omitida para producto ${dto.productId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
    }
    const batch = await this.createBatch(tenantId, dto);

    try {
      const ctx = await this.contextFacade.buildGenerationContext(tenantId, dto);
      const result = await this.runAdapterGeneration(tenantId, userId, dto, ctx);
      const { publishedPosts, imagesAttached } = await this.savePostsAsContent(
        tenantId, userId, result.posts, dto, ctx,
      );
      return await this.finalizeGenerationBatch(batch, result, publishedPosts, imagesAttached, dto, tenantId);
    } catch (error) {
      return this.handleGenerationError(error, batch);
    }
  }

  private validatePlatforms(platforms?: string[]): void {
    if (!platforms?.length) {
      throw new BadRequestException({ error: 'At least one platform is required', code: 'VALIDATION_ERROR' });
    }
  }

  private async runAdapterGeneration(
    tenantId: string,
    userId: string,
    dto: GenerateSocialCopyDto,
    ctx: GenerationContext,
  ) {
    this.logger.log(`Generating ${dto.count} posts for ${dto.platforms.join(', ')}`);
    return runWithLlmUsageContext({ tenantId, userId }, () =>
      this.adapter.generate({
        tenantId,
        platforms: dto.platforms,
        count: dto.count,
        postsPerPlatform: dto.postsPerPlatform,
        campaignId: dto.campaignId,
        productId: ctx.effectiveProductId,
        tone: dto.tone,
        topics: dto.topics,
        brandBrief: ctx.brandBrief,
        productContext: ctx.productContext as unknown as Record<string, unknown>,
        focusProductName: ctx.productContext?.name ?? null,
        competitorIntelBrief: ctx.competitorIntelBrief,
        cmCharacterReady: ctx.cmCharacterReady,
        cmCharacters: ctx.cmCharacters.length > 0 ? ctx.cmCharacters : undefined,
        mediaKit: ctx.mediaKitContext,
        libraryFolders: ctx.libraryFolders.map(({ path, device, imageCount, videoCount }) => ({
          path, device, imageCount, videoCount,
        })),
        knowledgeContext: ctx.knowledgeContext,
      }),
    );
  }

  private async createBatch(
    tenantId: string,
    dto: GenerateSocialCopyDto,
  ): Promise<CommunityManagerBatchEntity> {
    return this.batches.save(
      this.batches.create({
        tenantId,
        data: {
          platforms: dto.platforms,
          tone: dto.tone,
          topics: dto.topics,
          productId: dto.productId,
          campaignId: dto.campaignId,
        },
        posts: [],
        publishedPosts: [],
      }),
    );
  }

  private async finalizeGenerationBatch(
    batch: CommunityManagerBatchEntity,
    result: { posts: SocialCopyPost[]; summary?: string; publishingGuide?: string; generatedAt?: string },
    publishedPosts: string[],
    imagesAttached: number,
    dto: GenerateSocialCopyDto,
    tenantId: string,
  ): Promise<GenerateResponse> {
    batch.data = {
      ...batch.data,
      summary: result.summary,
      publishingGuide: result.publishingGuide,
      generatedAt: result.generatedAt,
    };
    batch.posts = result.posts as unknown as Array<Record<string, unknown>>;
    batch.publishedPosts = publishedPosts;
    await this.batches.save(batch);

    if (dto.campaignId && publishedPosts.length > 0) {
      await this.refreshCampaignLinkedContent(tenantId, dto.campaignId);
    }

    if (result.posts.length === 0) {
      throw new BadRequestException({
        error: 'La IA no devolvió publicaciones. Revisa la configuración LLM.',
        code: 'CM_EMPTY_RESULT',
      });
    }

    if (publishedPosts.length === 0) {
      throw new BadRequestException({
        error: 'Se generó copy pero no se pudo guardar en Contenidos. Revisa los logs del servidor.',
        code: 'CM_CONTENT_SAVE_FAILED',
      });
    }

    return {
      id: batch.id,
      status: 'completed',
      postsGenerated: publishedPosts.length,
      imagesAttached,
    };
  }

  private async refreshCampaignLinkedContent(tenantId: string, campaignId: string): Promise<void> {
    await this.contextFacade.refreshCampaignLinkedContent(tenantId, campaignId);
  }

  private formatPostBody(post: SocialCopyPost): string {
    const parts = [sanitizePublishableCopy(post.body)];
    if (post.hashtags?.length) {
      parts.push('\n\n' + post.hashtags.map((h) => `#${h}`).join(' '));
    }
    return parts.join('');
  }

  private toResponse(entity: CommunityManagerBatchEntity): SocialCopyBatchResponse {
    const data = entity.data as Record<string, unknown>;
    const posts = (entity.posts as unknown as SocialCopyPost[]).map((p) => ({
      id: p.id,
      platform: p.platform,
      title: p.title,
      body: p.body,
      hashtags: p.hashtags,
      visualDescription: p.visualDescription,
      visualFormat: p.visualFormat,
      bestTime: p.bestTime,
      targetAudience: p.targetAudience,
      callToAction: p.callToAction,
      tone: p.tone,
      contentId: (p as unknown as Record<string, unknown>).contentId as string | undefined,
    }));
    const failed = !!entity.errorMessage;

    return {
      id: entity.id,
      summary: (data.summary as string) ?? '',
      posts,
      publishingGuide: (data.publishingGuide as string) ?? '',
      generatedAt: (data.generatedAt as string) ?? entity.createdAt.toISOString(),
      createdAt: entity.createdAt.toISOString(),
      status: failed ? 'failed' : 'completed',
      errorMessage: entity.errorMessage,
      publishedCount: entity.publishedPosts?.length ?? 0,
    };
  }

  async regeneratePostForContent(
    tenantId: string,
    userId: string,
    contentId: string,
    options?: { feedback?: string; versionId?: string; visualFormat?: string },
  ): Promise<{ contentId: string; title: string; regenerated: true }> {
    const content = await this.contents.findOne({ where: { id: contentId, tenantId } });
    if (!content) {
      throw new NotFoundException({ error: 'Contenido no encontrado', code: 'NOT_FOUND' });
    }

    const { feedback, forcedVisualFormat, currentVersion } = await this.prepareRegeneration(
      tenantId, userId, contentId, options,
    );
    const deps = await this.contextFacade.buildRegenerationContext(
      tenantId, content, (platforms) => this.normalizePlatforms(platforms),
    );
    const result = await this.runRegenerationAdapter(tenantId, userId, content, deps, feedback, forcedVisualFormat, currentVersion);
    const post = this.extractSinglePost(result);
    if (forcedVisualFormat) post.visualFormat = forcedVisualFormat;

    await this.updateContentWithRegeneratedPost(tenantId, userId, contentId, post, feedback);
    await this.handlePostRegenerationVisual(
      tenantId, userId, contentId, post, content, deps, currentVersion, feedback,
    );

    return { contentId, title: post.title, regenerated: true };
  }

  async recomposeVisualForContent(
    tenantId: string,
    userId: string,
    contentId: string,
    options: { mode?: 'recompose' | 'regenerate' } = {},
  ): Promise<{ contentId: string; attached: boolean; templateId?: string; assetIds: string[] }> {
    const mode = options.mode ?? 'recompose';
    const content = await this.contentService.findOne(tenantId, contentId);
    const version = content.currentVersion;
    if (!version) {
      throw new BadRequestException({
        error: 'El contenido no tiene versión actual',
        code: 'VALIDATION_ERROR',
      });
    }

    const productId = content.productId;
    if (!productId) {
      throw new BadRequestException({
        error: 'Asocia un producto al contenido para recomponer la plantilla visual',
        code: 'VALIDATION_ERROR',
      });
    }

    const ctx = await this.contextFacade.buildGenerationContext(tenantId, { productId });
    const post = socialCopyPostFromContent(content, version);
    const visualVariantIndex = version.versionNumber ?? 0;
    const forceTemplateId: VisualTemplateId | undefined = isVisualTemplateId(
      content.visualTemplateId ?? undefined,
    )
      ? (content.visualTemplateId as VisualTemplateId)
      : undefined;
    const composeCtx = { resolvedProfile: ctx.resolvedProfile };
    const recentRecipeIds =
      mode === 'regenerate' && content.artRecipeId ? [content.artRecipeId] : undefined;
    const templateVariationSeed =
      mode === 'regenerate' ? visualVariantIndex + 1 : visualVariantIndex;

    if (mode === 'recompose') {
      const recomposed = await this.templateComposer.recomposeFromStoredTemplate(
        tenantId,
        userId,
        contentId,
        post,
        productId,
        ctx.kit,
        visualVariantIndex,
        composeCtx,
      );
      if (recomposed) {
        const updated = await this.contentService.findOne(tenantId, contentId);
        return {
          contentId,
          attached: true,
          assetIds: this.extractVersionAssetIds(updated.currentVersion),
        };
      }
    }

    const cmPortraitAssetId = await this.cmCharacter
      .resolveDefaultPortraitAssetId(tenantId, productId)
      .catch(() => null);
    const creativeSceneOptions = {
      postIndex: visualVariantIndex + (mode === 'regenerate' ? 1 : 0),
      cmPortraitReady: Boolean(cmPortraitAssetId),
    };

    if (wantsProductScreenShowcase(post) && shouldUseArtKitCompose(post, ctx.kit, creativeSceneOptions)) {
      const artKitResult = await this.artKitCompose.tryCompose(
        tenantId,
        userId,
        contentId,
        post,
        productId,
        ctx.kit,
        visualVariantIndex,
        {
          resolvedProfile: ctx.resolvedProfile,
          competitorIntelBrief: ctx.competitorIntelBrief,
        },
        recentRecipeIds,
      );
      if (artKitResult.attached) {
        return {
          contentId,
          attached: true,
          assetIds: artKitResult.assetIds,
        };
      }
    }

    if (shouldUseCreativeScene(post, ctx.kit, creativeSceneOptions)) {
      const sceneResult = await this.sceneKitCompose.tryCompose(
        tenantId,
        userId,
        contentId,
        post,
        productId,
        ctx.kit,
        visualVariantIndex,
        {
          resolvedProfile: ctx.resolvedProfile,
          competitorIntelBrief: ctx.competitorIntelBrief,
        },
        recentRecipeIds,
      );
      if (sceneResult.attached) {
        return {
          contentId,
          attached: true,
          assetIds: sceneResult.assetIds,
        };
      }
    }

    if (mode === 'recompose') {
      throw new BadRequestException({
        error:
          'Este visual es una escena generada con IA. Guarda el estilo visual y pulsa «Regenerar escena» para aplicarlo.',
        code: 'VISUAL_RECOMPOSE_NOT_APPLICABLE',
      });
    }

    const result = await this.templateComposer.tryComposeFromTemplate(
      tenantId,
      userId,
      contentId,
      post,
      productId,
      ctx.kit,
      visualVariantIndex,
      composeCtx,
      forceTemplateId
        ? {
            forceTemplateId,
            imageDestination: post.imageDestination,
            variationSeed: templateVariationSeed,
          }
        : { imageDestination: post.imageDestination, variationSeed: templateVariationSeed },
    );

    if (!result.attached) {
      throw new BadRequestException({
        error: 'No se pudo regenerar el visual. Verifica el kit de medios y el estilo visual del contenido.',
        code: 'VISUAL_RECOMPOSE_FAILED',
      });
    }

    return {
      contentId,
      attached: true,
      templateId: result.templateId,
      assetIds: result.assetIds,
    };
  }

  private async prepareRegeneration(
    tenantId: string, userId: string, contentId: string,
    options?: { feedback?: string; versionId?: string; visualFormat?: string },
  ) {
    const feedback = options?.feedback?.trim();
    const forcedVisualFormat = options?.visualFormat ? normalizeContentVisualFormat(options.visualFormat) : null;
    const fullContent = await this.contentService.findOne(tenantId, contentId);
    const currentVersion = fullContent.currentVersion ?? null;

    if (feedback && !options?.versionId) {
      throw new BadRequestException({ error: 'versionId is required when providing feedback', code: 'VALIDATION_ERROR' });
    }
    if (feedback) {
      await this.contentService.recordChangesRequested(tenantId, userId, contentId, options!.versionId!, feedback);
    }
    return { feedback, forcedVisualFormat, currentVersion };
  }

  private async runRegenerationAdapter(
    tenantId: string, userId: string, content: ContentEntity,
    deps: GenerationContext & { platform: CmPlatform },
    feedback: string | undefined, forcedVisualFormat: string | null,
    currentVersion: { versionNumber?: number; title?: string; body?: string } | null,
  ) {
    const revisionBrief = this.buildRevisionBrief(feedback, forcedVisualFormat);
    return runWithLlmUsageContext({ tenantId, userId }, () =>
      this.adapter.generate({
        tenantId,
        platforms: [deps.platform],
        count: 1,
        campaignId: content.campaignId ?? undefined,
        productId: deps.effectiveProductId,
        brandBrief: deps.brandBrief,
        productContext: deps.productContext as unknown as Record<string, unknown>,
        focusProductName: deps.productContext?.name ?? null,
        competitorIntelBrief: deps.competitorIntelBrief,
        revisionBrief,
        cmCharacterReady: deps.cmCharacterReady,
        cmCharacters: deps.cmCharacters.length > 0 ? deps.cmCharacters : undefined,
        previousPost: currentVersion?.title && currentVersion?.body
          ? { title: currentVersion.title, body: currentVersion.body, platform: content.platform ?? undefined }
          : undefined,
        mediaKit: deps.mediaKitContext,
        libraryFolders: deps.libraryFolders.map(({ path, device, imageCount, videoCount }) => ({ path, device, imageCount, videoCount })),
        knowledgeContext: deps.knowledgeContext,
      }),
    );
  }

  private extractSinglePost(result: { posts: SocialCopyPost[] }): SocialCopyPost {
    const post = result.posts[0];
    if (!post) {
      throw new BadRequestException({ error: 'No se pudo regenerar el post', code: 'GENERATION_FAILED' });
    }
    return post;
  }

  private async updateContentWithRegeneratedPost(
    tenantId: string, userId: string, contentId: string, post: SocialCopyPost, feedback: string | undefined,
  ): Promise<void> {
    await this.contentService.update(tenantId, userId, contentId, {
      title: post.title,
      body: this.formatPostBody(post),
      changeSummary: feedback ? `Regenerado con feedback: ${feedback.slice(0, 120)}` : 'Regenerado por el copiloto',
      visualFormat: post.visualFormat,
      platform: post.platform,
      visualPrompt: sanitizeVisualPromptForArt(post.visualDescription, post.body) || null,
      visualTemplateId: isVisualDesignPresetId(post.visualTemplateId) ? post.visualTemplateId : null,
      visualScene: resolveStoredVisualScene(post),
      visualHeadline: post.visualHeadline ?? null,
      visualSubline: post.visualSubline ?? null,
      visualCta: post.visualCta ?? null,
      imageDestination: resolveContentImageDestination(post),
    });
  }

  private buildRevisionBrief(
    feedback: string | undefined,
    forcedVisualFormat: string | null,
  ): string | undefined {
    const parts = [feedback?.trim(), buildMediaKitRevisionHint(feedback)].filter(Boolean);

    if (!forcedVisualFormat) {
      return parts.length ? parts.join('\n\n') : undefined;
    }

    const formatHint = `Regenera el post con formato visual "${forcedVisualFormat}" (adapta copy y escena visual al nuevo formato).`;
    parts.push(formatHint);
    return parts.join('\n\n');
  }

  private extractVersionAssetIds(
    version: { assets?: unknown } | null | undefined,
  ): string[] {
    if (!version?.assets || !Array.isArray(version.assets)) {
      return [];
    }

    return version.assets
      .map((asset) => {
        if (typeof asset === 'string') {
          return asset;
        }
        if (asset && typeof asset === 'object' && 'id' in asset) {
          const id = (asset as { id?: unknown }).id;
          return typeof id === 'string' ? id : null;
        }
        return null;
      })
      .filter((id): id is string => Boolean(id));
  }

  private buildComposeOptions(
    post: SocialCopyPost,
    feedback: string | undefined,
    currentVersion: { versionNumber?: number; assets?: unknown } | null,
  ): {
    targetSlideIndices?: number[];
    existingAssetIds?: string[];
    variationSeed: number;
  } {
    const visualVariantIndex = currentVersion?.versionNumber ?? 0;
    const frameCount =
      normalizeContentVisualFormat(post.visualFormat) === 'carousel'
        ? visualFormatToFrameCount('carousel')
        : 1;
    const targetSlideIndices = parseFeedbackTargetFrames(feedback, frameCount);
    const existingAssetIds = this.extractVersionAssetIds(currentVersion);

    return {
      ...(targetSlideIndices && existingAssetIds.length > 0
        ? { targetSlideIndices, existingAssetIds }
        : {}),
      variationSeed: visualVariantIndex + (targetSlideIndices?.length ?? 1) + 1,
    };
  }

  private async handlePostRegenerationVisual(
    tenantId: string,
    userId: string,
    contentId: string,
    post: SocialCopyPost,
    content: ContentEntity,
    ctx: GenerationContext,
    currentVersion: { versionNumber?: number; assets?: unknown } | null,
    feedback: string | undefined,
  ): Promise<void> {
    const visualVariantIndex = currentVersion?.versionNumber ?? 0;
    const productId = content.productId ?? ctx.effectiveProductId;
    const hasKitImages = kitHasComposeImageRoles(ctx.kit);
    const wantsMediaKit = feedbackRequestsMediaKit(feedback) || hasKitImages;
    const allowAiFallback =
      feedbackRequestsAiImage(feedback) ||
      (!hasKitImages && !feedbackRequestsMediaKit(feedback));
    const composeOptions = this.buildComposeOptions(post, feedback, currentVersion);
    const composeCtx = { resolvedProfile: ctx.resolvedProfile };

    if (productId && hasKitImages) {
      if (composeOptions.targetSlideIndices) {
        const partial = await this.templateComposer.tryComposeFromTemplate(
          tenantId,
          userId,
          contentId,
          post,
          productId,
          ctx.kit,
          visualVariantIndex,
          composeCtx,
          composeOptions,
        );
        if (partial.attached) {
          return;
        }
      }

      const composed = await this.attachVisualForPost(
        tenantId,
        userId,
        contentId,
        post,
        productId,
        ctx.kit,
        visualVariantIndex,
        ctx,
      );
      if (composed) {
        return;
      }

      const recomposed = await this.templateComposer.recomposeFromStoredTemplate(
        tenantId,
        userId,
        contentId,
        post,
        productId,
        ctx.kit,
        visualVariantIndex,
        composeCtx,
        {
          targetSlideIndices: composeOptions.targetSlideIndices,
          existingAssetIds: composeOptions.existingAssetIds,
        },
      );
      if (recomposed) {
        return;
      }

      if (feedback) {
        const varied = await this.templateComposer.tryComposeFromTemplate(
          tenantId,
          userId,
          contentId,
          post,
          productId,
          ctx.kit,
          visualVariantIndex,
          composeCtx,
          composeOptions,
        );
        if (varied.attached) {
          return;
        }
      }
    }

    if (!feedback) {
      await this.regenerateVisualWithoutFeedback(
        tenantId, userId, contentId, post, ctx,
      );
      return;
    }

    if (wantsMediaKit && hasKitImages && !feedbackRequestsAiImage(feedback)) {
      this.logger.warn(
        `Media kit compose failed for content ${contentId} despite kit items; skipping AI fallback`,
      );
      return;
    }

    if (!post.visualDescription?.trim()) {
      return;
    }

    if (productId) {
      const composed = await this.attachVisualForPost(
        tenantId, userId, contentId, post,
        productId, ctx.kit, visualVariantIndex, ctx,
      );
      if (composed) {
        return;
      }
    }

    if (!allowAiFallback) {
      return;
    }

    try {
      await this.imageGeneration.regenerateForContent(tenantId, userId, contentId);
    } catch (error) {
      this.logger.warn(`Visual regenerate failed for content ${contentId}`, error);
    }
  }

  private async regenerateVisualWithoutFeedback(
    tenantId: string,
    userId: string,
    contentId: string,
    post: SocialCopyPost,
    ctx: GenerationContext,
  ): Promise<void> {
    try {
      const productId = ctx.effectiveProductId;
      if (productId) {
        const templated = await this.attachVisualForPost(
          tenantId, userId, contentId, post, productId, ctx.kit, 0, ctx,
        );
        if (templated) return;
      }

      if (!post.visualDescription?.trim()) {
        if (kitHasComposeImageRoles(ctx.kit)) {
          await this.recomposeVisualForContent(tenantId, userId, contentId, { mode: 'regenerate' });
          return;
        }
        await this.imageGeneration.regenerateForContent(tenantId, userId, contentId);
        return;
      }

      const enriched = await this.buildEnrichedVisualDescription(
        tenantId,
        post.visualDescription,
        productId,
        ctx,
      );
      await this.imageGeneration.attachVisualToContent(
        tenantId, userId, contentId, enriched, productId,
      );
    } catch (error) {
      this.logger.warn(`Visual regenerate failed for content ${contentId}`, error);
    }
  }

  private async attachVisualForPost(
    tenantId: string,
    userId: string,
    contentId: string,
    post: SocialCopyPost,
    productId: string | null | undefined,
    kit: GenerationContext['kit'],
    postIndex: number,
    ctx: GenerationContext,
    recentRecipeIds?: string[],
  ): Promise<boolean> {
    const visualFormat = normalizeContentVisualFormat(post.visualFormat);

    if (visualFormat === 'talking-head' && productId) {
      const talkingHeadAttached = await this.talkingHeadComposer.attachToContent(
        tenantId,
        userId,
        contentId,
        post,
        productId,
      );
      if (talkingHeadAttached) {
        return true;
      }
      this.logger.log(
        `Talking-head falló para content ${contentId}; reintentando con plantilla y capturas del media kit`,
      );

      const staticPost: SocialCopyPost = { ...post, visualFormat: 'image' };
      const templatedAfterTalkingHead = await this.templateComposer.tryComposeFromTemplate(
        tenantId,
        userId,
        contentId,
        staticPost,
        productId,
        kit,
        postIndex,
        { resolvedProfile: ctx.resolvedProfile },
      );
      if (templatedAfterTalkingHead.attached) {
        return true;
      }
    }

    const intent = resolveVisualIntent(post);
    const skipTemplateForAiArt = intent.preferLayout === 'ai-art';

    const cmPortraitAssetId = productId
      ? await this.cmCharacter.resolveDefaultPortraitAssetId(tenantId, productId).catch(() => null)
      : null;
    const creativeSceneOptions = {
      postIndex,
      cmPortraitReady: Boolean(cmPortraitAssetId),
    };

    if (productId && wantsProductScreenShowcase(post) && shouldUseArtKitCompose(post, kit, creativeSceneOptions)) {
      const artKitResult = await this.artKitCompose.tryCompose(
        tenantId,
        userId,
        contentId,
        post,
        productId,
        kit,
        postIndex,
        {
          resolvedProfile: ctx.resolvedProfile,
          competitorIntelBrief: ctx.competitorIntelBrief,
        },
        recentRecipeIds,
      );
      if (artKitResult.attached) {
        if (artKitResult.recipeId) {
          post.artRecipeId = artKitResult.recipeId;
        }
        return true;
      }
    }

    if (productId && shouldUseCreativeScene(post, kit, creativeSceneOptions)) {
      const sceneResult = await this.sceneKitCompose.tryCompose(
        tenantId,
        userId,
        contentId,
        post,
        productId,
        kit,
        postIndex,
        {
          resolvedProfile: ctx.resolvedProfile,
          competitorIntelBrief: ctx.competitorIntelBrief,
        },
        recentRecipeIds,
      );
      if (sceneResult.attached) {
        if (sceneResult.recipeId) {
          post.artRecipeId = sceneResult.recipeId;
        }
        return true;
      }
    }

    const skipTemplateForCreative = shouldSkipTemplateForCreativeScene(
      post,
      kit,
      creativeSceneOptions,
    );

    if (productId && !skipTemplateForAiArt && !skipTemplateForCreative) {
      const templated = await this.templateComposer.tryComposeFromTemplate(
        tenantId,
        userId,
        contentId,
        post,
        productId,
        kit,
        postIndex,
        { resolvedProfile: ctx.resolvedProfile },
      );
      if (templated.attached) {
        return true;
      }
    }

    if (productId && shouldUseArtKitCompose(post, kit, creativeSceneOptions)) {
      const artKitResult = await this.artKitCompose.tryCompose(
        tenantId,
        userId,
        contentId,
        post,
        productId,
        kit,
        postIndex,
        {
          resolvedProfile: ctx.resolvedProfile,
          competitorIntelBrief: ctx.competitorIntelBrief,
        },
        recentRecipeIds,
      );
      if (artKitResult.attached) {
        if (artKitResult.recipeId) {
          post.artRecipeId = artKitResult.recipeId;
        }
        return true;
      }
    }

    if (kitHasComposeImageRoles(kit) && !isAiArtTemplateId(post.visualTemplateId)) {
      this.logger.warn(
        `Media kit disponible pero art-kit-compose y plantilla fallaron para content ${contentId}; no se usará imagen IA pura`,
      );
      return false;
    }

    if (!post.visualDescription?.trim() && !post.visualIntent?.subject?.trim()) {
      return false;
    }

    try {
      let visualDescription = post.visualDescription?.trim() ?? '';
      let artRecipeBasePrompt: string | undefined;
      let artRecipeId: string | undefined;

      if (shouldUseArtPromptLibrary(post, kit)) {
        const brandKit = productId
          ? resolveVisualBrandKit(
              await this.productService.findOwnedEntity(tenantId, productId),
              ctx.resolvedProfile,
            )
          : null;

        const resolved = await this.artPromptSelector.resolveVisualPrompt(
          post,
          {
            industry: ctx.resolvedProfile?.industry ?? null,
            competitorIntelBrief: ctx.competitorIntelBrief,
          },
          brandKit,
          recentRecipeIds,
          kit,
        );

        if (resolved.recipeId) {
          artRecipeId = resolved.recipeId;
          artRecipeBasePrompt = resolved.artRecipeBasePrompt;
          visualDescription = resolved.visualDescription;
          post.artRecipeId = resolved.recipeId;
        } else if (resolved.visualDescription) {
          visualDescription = resolved.visualDescription;
        }
      } else if (visualDescription) {
        visualDescription = await this.buildEnrichedVisualDescription(
          tenantId,
          visualDescription,
          productId ?? undefined,
          ctx,
        );
      }

      if (!visualDescription.trim()) {
        return false;
      }

      const imageResult = await this.imageGeneration.attachVisualToContent(
        tenantId,
        userId,
        contentId,
        visualDescription,
        productId ?? undefined,
        {
          artRecipeBasePrompt,
          artRecipeId,
        },
      );
      return imageResult?.status === 'completed';
    } catch (error) {
      this.logger.warn(`Image attach failed for content ${contentId}`, error);
      return false;
    }
  }

  private async buildEnrichedVisualDescription(
    tenantId: string,
    visualDescription: string,
    productId: string | undefined,
    ctx: GenerationContext,
  ): Promise<string> {
    if (!productId) {
      return visualDescription;
    }
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const brandKit = resolveVisualBrandKit(product, ctx.resolvedProfile);
    return enrichVisualDescriptionForAi(
      visualDescription,
      brandKit,
      ctx.competitorIntelBrief,
    );
  }
}