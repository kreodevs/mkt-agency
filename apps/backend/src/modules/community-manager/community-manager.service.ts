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
import { CompanyProfileModule } from '../company-profile/company-profile.module';
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { CompanyProfileSectionEntity } from '../company-profile/infrastructure/typeorm/company-profile-section.entity';
import {
  ProfileSectionSyncService,
  ResolvedProfileValues,
} from '../company-profile/services/profile-section-sync.service';
import { ContentService } from '../content/content.service';
import { CompetitorIntelService } from '../agents/competitor-intel.service';
import { CompetitorService } from '../competitors/competitor.service';
import { ImageGenerationService } from '../agents/image-generation.service';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import {
  mergeBrandAndProductBrief,
  toProductContext,
} from '../product/domain/product-context.util';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import { ProductService } from '../product/product.service';
import { ProductMediaKitService } from '../product/product-media-kit.service';
import { AssetFolderService } from '../assets/asset-folder.service';
import { TenantEntity } from '../tenant/infrastructure/typeorm/tenant.entity';
import { ContentVisualComposerService } from './content-visual-composer.service';
import { CmCharacterService } from './cm-character.service';
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
import { buildCompetitorIntelBriefForSocialCopy } from './domain/competitor-intel-brief.util';
import { sanitizePublishableCopy } from '../../shared/domain/sanitize-publishable-copy.util';

@Injectable()
export class CommunityManagerService {
  private readonly logger = new Logger(CommunityManagerService.name);

  constructor(
    @InjectRepository(CommunityManagerBatchEntity)
    private readonly batches: Repository<CommunityManagerBatchEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(CompanyProfileEntity)
    private readonly profiles: Repository<CompanyProfileEntity>,
    @InjectRepository(CompanyProfileSectionEntity)
    private readonly profileSections: Repository<CompanyProfileSectionEntity>,
    @InjectRepository(ProductEntity)
    private readonly productEntities: Repository<ProductEntity>,
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
    @InjectRepository(ContentEntity)
    private readonly contents: Repository<ContentEntity>,
    @Inject(SOCIAL_COPY_ADAPTER)
    private readonly adapter: SocialCopyAdapterPort,
    private readonly llmProviders: LlmProviderService,
    private readonly contentService: ContentService,
    private readonly imageGeneration: ImageGenerationService,
    private readonly productService: ProductService,
    private readonly profileSectionSync: ProfileSectionSyncService,
    private readonly competitorIntel: CompetitorIntelService,
    private readonly competitorService: CompetitorService,
    private readonly mediaKitService: ProductMediaKitService,
    private readonly assetFolderService: AssetFolderService,
    private readonly visualComposer: ContentVisualComposerService,
    private readonly cmCharacter: CmCharacterService,
    private readonly talkingHeadComposer: TalkingHeadPostComposerService,
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
    const profile = await this.profiles.findOne({ where: { tenantId } });
    const sections = profile
      ? await this.profileSections.find({ where: { profileId: profile.id } })
      : [];
    const values = this.profileSectionSync.resolveProfileValues(profile, sections);
    const primaryProduct = await this.productService.findPrimary(tenantId);
    const productReady =
      !!primaryProduct &&
      Boolean(
        (primaryProduct.description?.trim() || primaryProduct.valueProposition?.trim()) &&
          primaryProduct.targetAudience?.trim(),
      );

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
        complete: !!values.companyName?.trim(),
        href: '/onboarding',
      },
      {
        key: 'industry',
        label: 'Industria / sector',
        description: 'Ayuda a elegir temas y referencias del mercado.',
        complete: !!values.industry?.trim(),
        href: '/onboarding',
      },
      {
        key: 'brandVoice',
        label: 'Voz de marca',
        description: 'Define estilo, registro y personalidad del contenido.',
        complete: !!values.brandVoice?.trim(),
        href: '/onboarding',
      },
      {
        key: 'targetAudienceDesc',
        label: 'Audiencia objetivo',
        description: 'Permite adaptar mensajes y CTAs por segmento.',
        complete: !!values.targetAudienceDesc?.trim(),
        href: '/onboarding',
      },
      {
        key: 'objectives',
        label: 'Objetivos de marketing',
        description: 'Orienta la estrategia detrás de cada publicación (recomendado).',
        complete: values.objectives.length > 0,
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

  private buildBrandBrief(
    values: ResolvedProfileValues | null,
    productContext: ReturnType<typeof toProductContext> | null,
  ): Record<string, unknown> | null {
    return mergeBrandAndProductBrief(values, productContext);
  }

  private async resolveCompetitorIntelBrief(
    tenantId: string,
  ): Promise<Record<string, unknown> | null> {
    const [latestAnalysis, competitorList] = await Promise.all([
      this.competitorIntel.getLatestCompletedAnalysis(tenantId),
      this.competitorService.list(tenantId),
    ]);

    const trackedCompetitorNames = competitorList.items.map((item) => item.name);
    const brief = buildCompetitorIntelBriefForSocialCopy({
      analysisId: latestAnalysis?.id ?? 'none',
      generatedAt: latestAnalysis?.updatedAt.toISOString() ?? new Date().toISOString(),
      analysis: latestAnalysis?.analysis ?? null,
      trackedCompetitorNames,
    });

    if (brief) {
      this.logger.log(
        `Competitor intel wired into CM: analysis=${latestAnalysis?.id ?? 'names-only'} competitors=${brief.competitors.length}`,
      );
    }

    return brief as unknown as Record<string, unknown> | null;
  }

  private async resolveProductForGeneration(
    tenantId: string,
    productId?: string,
    campaignId?: string,
  ): Promise<ReturnType<typeof toProductContext> | null> {
    if (productId) {
      const product = await this.productService.findOwnedEntity(tenantId, productId);
      return toProductContext(product);
    }

    if (campaignId) {
      const campaign = await this.campaigns.findOne({ where: { id: campaignId, tenantId } });
      if (campaign?.productId) {
        const product = await this.productEntities.findOne({
          where: { id: campaign.productId, tenantId },
        });
        if (product) {
          return toProductContext(product);
        }
      }
    }

    const primary = await this.productService.findPrimary(tenantId);
    return primary ? toProductContext(primary) : null;
  }

  private async loadResolvedProfile(tenantId: string): Promise<ResolvedProfileValues | null> {
    const profile = await this.profiles.findOne({ where: { tenantId } });
    if (!profile) {
      return null;
    }
    const sections = await this.profileSections.find({ where: { profileId: profile.id } });
    return this.profileSectionSync.resolveProfileValues(profile, sections);
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
    if (!dto.platforms?.length) {
      throw new BadRequestException({ error: 'At least one platform is required', code: 'VALIDATION_ERROR' });
    }

    // Create batch record
    const batch = await this.batches.save(
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

    try {
      const resolvedProfile = await this.loadResolvedProfile(tenantId);
      const productContext = await this.resolveProductForGeneration(
        tenantId,
        dto.productId,
        dto.campaignId,
      );
      const brandBrief = this.buildBrandBrief(resolvedProfile, productContext);
      const competitorIntelBrief = await this.resolveCompetitorIntelBrief(tenantId);
      const effectiveProductId = productContext?.id ?? dto.productId;
      const kit = effectiveProductId
        ? await this.mediaKitService.listEntitiesForProduct(tenantId, effectiveProductId)
        : [];
      const cmCharacters = effectiveProductId
        ? await this.cmCharacter.listReadyForLlm(tenantId, effectiveProductId)
        : [];
      const cmCharacterReady = effectiveProductId
        ? await this.cmCharacter.hasAnyReadyCharacter(tenantId, effectiveProductId)
        : false;

      const libraryFolders = await this.assetFolderService.buildLibrarySummaryForLlm(tenantId);
      const mediaKitContext = kit.length
        ? await this.mediaKitService.buildMediaKitContextForLlm(tenantId, kit)
        : [];

      this.logger.log(`Generating ${dto.count} posts for ${dto.platforms.join(', ')}`);
      const result = await runWithLlmUsageContext(
        { tenantId, userId },
        () =>
          this.adapter.generate({
            tenantId,
            platforms: dto.platforms,
            count: dto.count,
            campaignId: dto.campaignId,
            productId: effectiveProductId,
            tone: dto.tone,
            topics: dto.topics,
            brandBrief,
            productContext: productContext as unknown as Record<string, unknown>,
            focusProductName: productContext?.name ?? null,
            competitorIntelBrief,
            cmCharacterReady,
            cmCharacters: cmCharacters.length > 0 ? cmCharacters : undefined,
            mediaKit: mediaKitContext,
            libraryFolders: libraryFolders.map(({ path, device, imageCount, videoCount }) => ({
              path,
              device,
              imageCount,
              videoCount,
            })),
          }),
      );

      // Save each post as a Content item, spread across next days
      const publishedPosts: string[] = [];
      let imagesAttached = 0;
      const today = new Date();
      for (let i = 0; i < result.posts.length; i++) {
        const post = result.posts[i];
        try {
          const contentDto = new CreateContentDto();
          contentDto.title = post.title;
          contentDto.type = 'social';
          contentDto.body = this.formatPostBody(post);
          contentDto.campaignId = dto.campaignId;
          contentDto.productId = productContext?.id ?? dto.productId;
          // Spread posts across next days (starting tomorrow)
          const scheduleDate = new Date(today);
          scheduleDate.setDate(scheduleDate.getDate() + i + 1);
          contentDto.scheduledDate = scheduleDate.toISOString().split('T')[0];
          contentDto.platform = post.platform;
          contentDto.visualFormat = post.visualFormat;
          contentDto.visualPrompt = sanitizeVisualPromptForArt(
            post.visualDescription,
            post.body,
          ) || null;

          const content = await this.contentService.create(tenantId, userId, contentDto);

          post.contentId = content.id;
          publishedPosts.push(content.id);

          if (dto.attachImages !== false) {
            const attached = await this.attachVisualForPost(
              tenantId,
              userId,
              content.id,
              post,
              effectiveProductId,
              kit,
              i,
            );
            if (attached) {
              imagesAttached += 1;
            }
          }
        } catch (err) {
          this.logger.warn(`Failed to save post "${post.title}" as content: ${err}`);
        }
      }

      // Update batch with results
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
    } catch (error) {
      const message =
        error instanceof BadRequestException
          ? ((error.getResponse() as { error?: string })?.error ?? error.message)
          : error instanceof Error
            ? error.message
            : 'Generation failed';

      this.logger.error(`Social copy generation failed: ${message}`);
      batch.errorMessage = message;
      await this.batches.save(batch);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException({
        error: `No se pudo generar copy: ${message}. Revisa Ajustes → Proveedores LLM.`,
        code: 'CM_GENERATION_FAILED',
      });
    }
  }

  private async refreshCampaignLinkedContent(tenantId: string, campaignId: string): Promise<void> {
    const campaign = await this.campaigns.findOne({ where: { id: campaignId, tenantId } });
    if (!campaign) {
      return;
    }

    const linkedContentCount = await this.contents.count({
      where: { tenantId, campaignId },
    });
    const strategy = { ...(campaign.strategy ?? {}) };
    strategy.linkedContentCount = linkedContentCount;
    if (linkedContentCount > 0) {
      strategy.timeline = `${linkedContentCount} post${linkedContentCount === 1 ? '' : 's'} programado${linkedContentCount === 1 ? '' : 's'} — revisa en Calendario → Aprueba → Copia y publica en cada red`;
    }
    campaign.strategy = strategy;
    await this.campaigns.save(campaign);
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

    const feedback = options?.feedback?.trim();
    const forcedVisualFormat = options?.visualFormat
      ? normalizeContentVisualFormat(options.visualFormat)
      : null;
    const fullContent = await this.contentService.findOne(tenantId, contentId);
    const currentVersion = fullContent.currentVersion ?? null;

    if (feedback) {
      if (!options?.versionId) {
        throw new BadRequestException({
          error: 'versionId is required when providing feedback',
          code: 'VALIDATION_ERROR',
        });
      }
      await this.contentService.recordChangesRequested(
        tenantId,
        userId,
        contentId,
        options.versionId,
        feedback,
      );
    }

    let revisionBrief = feedback;
    if (forcedVisualFormat) {
      const formatHint = `Regenera el post con formato visual "${forcedVisualFormat}" (adapta copy y escena visual al nuevo formato).`;
      revisionBrief = feedback ? `${feedback}\n\n${formatHint}` : formatHint;
    }

    const platform = this.normalizePlatforms(
      content.platform ? [content.platform] : undefined,
    )[0];

    const resolvedProfile = await this.loadResolvedProfile(tenantId);
    const productContext = await this.resolveProductForGeneration(
      tenantId,
      content.productId ?? undefined,
      content.campaignId ?? undefined,
    );
    const brandBrief = this.buildBrandBrief(resolvedProfile, productContext);
    const competitorIntelBrief = await this.resolveCompetitorIntelBrief(tenantId);
    const kit = content.productId
      ? await this.mediaKitService.listEntitiesForProduct(tenantId, content.productId)
      : [];
    const effectiveProductId = productContext?.id ?? content.productId ?? undefined;
    const cmCharacters = effectiveProductId
      ? await this.cmCharacter.listReadyForLlm(tenantId, effectiveProductId)
      : [];
    const cmCharacterReady = effectiveProductId
      ? await this.cmCharacter.hasAnyReadyCharacter(tenantId, effectiveProductId)
      : false;

    const libraryFolders = await this.assetFolderService.buildLibrarySummaryForLlm(tenantId);
    const mediaKitContext = kit.length
      ? await this.mediaKitService.buildMediaKitContextForLlm(tenantId, kit)
      : [];

    const result = await runWithLlmUsageContext({ tenantId, userId }, () =>
      this.adapter.generate({
        tenantId,
        platforms: [platform],
        count: 1,
        campaignId: content.campaignId ?? undefined,
        productId: effectiveProductId,
        brandBrief,
        productContext: productContext as unknown as Record<string, unknown>,
        focusProductName: productContext?.name ?? null,
        competitorIntelBrief,
        revisionBrief,
        cmCharacterReady,
        cmCharacters: cmCharacters.length > 0 ? cmCharacters : undefined,
        previousPost: currentVersion
          ? {
              title: currentVersion.title,
              body: currentVersion.body,
              platform: content.platform ?? undefined,
            }
          : undefined,
        mediaKit: mediaKitContext,
        libraryFolders: libraryFolders.map(({ path, device, imageCount, videoCount }) => ({
          path,
          device,
          imageCount,
          videoCount,
        })),
      }),
    );

    const post = result.posts[0];
    if (!post) {
      throw new BadRequestException({
        error: 'No se pudo regenerar el post',
        code: 'GENERATION_FAILED',
      });
    }

    if (forcedVisualFormat) {
      post.visualFormat = forcedVisualFormat;
    }

    await this.contentService.update(tenantId, userId, contentId, {
      title: post.title,
      body: this.formatPostBody(post),
      changeSummary: feedback
        ? `Regenerado con feedback: ${feedback.slice(0, 120)}`
        : 'Regenerado por el copiloto',
      visualFormat: post.visualFormat,
      platform: post.platform,
      visualPrompt:
        sanitizeVisualPromptForArt(post.visualDescription, post.body) || null,
    });

    const visualVariantIndex = currentVersion?.versionNumber ?? 0;

    if (!feedback) {
      try {
        if (post.visualDescription?.trim()) {
          await this.imageGeneration.attachVisualToContent(
            tenantId,
            userId,
            contentId,
            post.visualDescription,
            content.productId ?? productContext?.id ?? undefined,
          );
        } else {
          await this.imageGeneration.regenerateForContent(tenantId, userId, contentId);
        }
      } catch (error) {
        this.logger.warn(`Visual regenerate failed for content ${contentId}`, error);
      }
    } else {
      const shouldRegenerateVisual = Boolean(feedback || post.visualDescription?.trim());
      if (shouldRegenerateVisual) {
        const composed = await this.attachVisualForPost(
          tenantId,
          userId,
          contentId,
          post,
          content.productId ?? productContext?.id,
          kit,
          visualVariantIndex,
        );
        if (!composed) {
          try {
            await this.imageGeneration.regenerateForContent(tenantId, userId, contentId);
          } catch (error) {
            this.logger.warn(`Visual regenerate failed for content ${contentId}`, error);
          }
        }
      }
    }

    return { contentId, title: post.title, regenerated: true };
  }

  private async attachVisualForPost(
    tenantId: string,
    userId: string,
    contentId: string,
    post: SocialCopyPost,
    productId: string | null | undefined,
    kit: Awaited<ReturnType<ProductMediaKitService['listEntitiesForProduct']>>,
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