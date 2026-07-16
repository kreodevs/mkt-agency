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
import { ContentVisualComposerService } from './content-visual-composer.service';
import { TalkingHeadPostComposerService } from './talking-head-post-composer.service';
import { normalizeContentVisualFormat } from '../content/domain/content-visual-format.util';
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
import { sanitizePublishableCopy } from '../../shared/domain/sanitize-publishable-copy.util';
import { toLocalDateKey } from '../../shared/domain/date-key.util';
import {
  GenerationContextFacade,
  type GenerationContext,
} from './generation-context.facade';

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
    private readonly visualComposer: ContentVisualComposerService,
    private readonly talkingHeadComposer: TalkingHeadPostComposerService,
    private readonly contextFacade: GenerationContextFacade,
  ) {}

  async getPreferences(tenantId: string): Promise<CommunityManagerPreferencesResponse> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException({ error: 'Tenant not found', code: 'NOT_FOUND' });
    }

    const stored = (tenant.settings?.communityManager ?? {}) as Record<string, unknown>;
    const platforms = this.normalizePlatforms(stored.platforms);
    const count =
      typeof stored.count === 'number' && stored.count >= 1 && stored.count <= 6
        ? stored.count
        : DEFAULT_CM_POST_COUNT;

    return { platforms, count };
  }

  async updatePreferences(
    tenantId: string,
    dto: UpdateCommunityManagerPreferencesDto,
  ): Promise<CommunityManagerPreferencesResponse> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException({ error: 'Tenant not found', code: 'NOT_FOUND' });
    }

    const platforms = this.normalizePlatforms(dto.platforms);
    const count = dto.count ?? DEFAULT_CM_POST_COUNT;

    tenant.settings = {
      ...tenant.settings,
      communityManager: { platforms, count },
    };
    await this.tenants.save(tenant);

    return { platforms, count };
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
    effectiveProductId: string | undefined,
    kit: GenerationContext['kit'],
  ): Promise<{ publishedPosts: string[]; imagesAttached: number }> {
    const publishedPosts: string[] = [];
    let imagesAttached = 0;
    const today = new Date();
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      try {
        const content = await this.saveSinglePost(
          tenantId, userId, post, dto, effectiveProductId, today, i,
        );
        post.contentId = content.id;
        publishedPosts.push(content.id);

        if (dto.attachImages === false) continue;
        const attached = await this.attachVisualForPost(
          tenantId, userId, content.id, post, effectiveProductId, kit, i,
        );
        if (attached) imagesAttached += 1;
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
    const batch = await this.createBatch(tenantId, dto);

    try {
      const ctx = await this.contextFacade.buildGenerationContext(tenantId, dto);
      const result = await this.runAdapterGeneration(tenantId, userId, dto, ctx);
      const { publishedPosts, imagesAttached } = await this.savePostsAsContent(
        tenantId, userId, result.posts, dto, ctx.effectiveProductId, ctx.kit,
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
      tenantId, userId, contentId, post, content, deps.productContext, deps.kit, currentVersion, feedback,
    );

    return { contentId, title: post.title, regenerated: true };
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
    });
  }

  private buildRevisionBrief(
    feedback: string | undefined,
    forcedVisualFormat: string | null,
  ): string | undefined {
    if (!forcedVisualFormat) {
      return feedback;
    }
    const formatHint = `Regenera el post con formato visual "${forcedVisualFormat}" (adapta copy y escena visual al nuevo formato).`;
    return feedback ? `${feedback}\n\n${formatHint}` : formatHint;
  }

  private async handlePostRegenerationVisual(
    tenantId: string,
    userId: string,
    contentId: string,
    post: SocialCopyPost,
    content: ContentEntity,
    productContext: GenerationContext['productContext'],
    kit: GenerationContext['kit'],
    currentVersion: { versionNumber?: number } | null,
    feedback: string | undefined,
  ): Promise<void> {
    const visualVariantIndex = currentVersion?.versionNumber ?? 0;

    if (!feedback) {
      await this.regenerateVisualWithoutFeedback(
        tenantId, userId, contentId, post, productContext,
      );
      return;
    }

    if (!post.visualDescription?.trim()) return;

    const composed = await this.attachVisualForPost(
      tenantId, userId, contentId, post,
      content.productId ?? productContext?.id, kit, visualVariantIndex,
    );
    if (composed) return;

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
    productContext: GenerationContext['productContext'],
  ): Promise<void> {
    try {
      const productId = post.visualDescription?.trim()
        ? (productContext?.id ?? undefined)
        : undefined;
      if (post.visualDescription?.trim()) {
        await this.imageGeneration.attachVisualToContent(
          tenantId, userId, contentId, post.visualDescription, productId,
        );
      } else {
        await this.imageGeneration.regenerateForContent(tenantId, userId, contentId);
      }
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
  ): Promise<boolean> {
    const visualFormat = normalizeContentVisualFormat(post.visualFormat);

    if (visualFormat === 'talking-head' && productId) {
      return this.talkingHeadComposer.attachToContent(
        tenantId,
        userId,
        contentId,
        post,
        productId,
      );
    }

    if (productId && kit.length) {
      const composed = await this.visualComposer.tryComposeFromKit(
        tenantId,
        userId,
        contentId,
        post,
        productId,
        kit,
        postIndex,
      );
      if (composed.attached) {
        return true;
      }
    }

    if (!post.visualDescription?.trim()) {
      return false;
    }

    try {
      const imageResult = await this.imageGeneration.attachVisualToContent(
        tenantId,
        userId,
        contentId,
        post.visualDescription,
        productId ?? undefined,
      );
      return imageResult?.status === 'completed';
    } catch (error) {
      this.logger.warn(`Image attach failed for content ${contentId}`, error);
      return false;
    }
  }
}