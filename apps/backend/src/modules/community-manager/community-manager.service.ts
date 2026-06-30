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
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { ContentService } from '../content/content.service';
import { TenantEntity } from '../tenant/infrastructure/typeorm/tenant.entity';
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
import { CreateContentDto } from '../content/dto/content.request.dto';

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
    @Inject(SOCIAL_COPY_ADAPTER)
    private readonly adapter: SocialCopyAdapterPort,
    private readonly llmProviders: LlmProviderService,
    private readonly contentService: ContentService,
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
    const objectives = Array.isArray(profile?.objectives) ? profile!.objectives : [];

    const items = [
      {
        key: 'companyName',
        label: 'Nombre de empresa',
        description: 'Identidad básica para contextualizar el copy.',
        complete: !!profile?.companyName?.trim(),
        href: '/onboarding',
      },
      {
        key: 'industry',
        label: 'Industria / sector',
        description: 'Ayuda a elegir temas y referencias del mercado.',
        complete: !!profile?.industry?.trim(),
        href: '/onboarding',
      },
      {
        key: 'brandVoice',
        label: 'Voz de marca',
        description: 'Define estilo, registro y personalidad del contenido.',
        complete: !!profile?.brandVoice?.trim(),
        href: '/onboarding',
      },
      {
        key: 'targetAudienceDesc',
        label: 'Audiencia objetivo',
        description: 'Permite adaptar mensajes y CTAs por segmento.',
        complete: !!profile?.targetAudienceDesc?.trim(),
        href: '/onboarding',
      },
      {
        key: 'objectives',
        label: 'Objetivos de marketing',
        description: 'Orienta la estrategia detrás de cada publicación.',
        complete: objectives.length > 0,
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

  private buildBrandBrief(profile: CompanyProfileEntity | null): Record<string, unknown> | null {
    if (!profile) {
      return null;
    }
    return {
      companyName: profile.companyName,
      industry: profile.industry,
      brandVoice: profile.brandVoice,
      targetAudience: profile.targetAudienceDesc,
      objectives: profile.objectives,
      competitors: profile.competitors,
      website: profile.website,
    };
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
        data: { platforms: dto.platforms, tone: dto.tone, topics: dto.topics },
        posts: [],
        publishedPosts: [],
      }),
    );

    try {
      const profile = await this.profiles.findOne({ where: { tenantId } });
      const brandBrief = this.buildBrandBrief(profile);

      // Generate social copy via adapter
      this.logger.log(`Generating ${dto.count} posts for ${dto.platforms.join(', ')}`);
      const result = await this.adapter.generate({
        tenantId,
        platforms: dto.platforms,
        count: dto.count,
        campaignId: dto.campaignId,
        tone: dto.tone,
        topics: dto.topics,
        brandBrief,
      });

      // Save each post as a Content item, spread across next days
      const publishedPosts: string[] = [];
      const today = new Date();
      for (let i = 0; i < result.posts.length; i++) {
        const post = result.posts[i];
        try {
          const contentDto = new CreateContentDto();
          contentDto.title = post.title;
          contentDto.type = 'social';
          contentDto.body = this.formatPostBody(post);
          contentDto.campaignId = dto.campaignId;
          // Spread posts across next days (starting tomorrow)
          const scheduleDate = new Date(today);
          scheduleDate.setDate(scheduleDate.getDate() + i + 1);
          contentDto.scheduledDate = scheduleDate.toISOString().split('T')[0];

          const content = await this.contentService.create(tenantId, userId, contentDto);

          post.contentId = content.id;
          publishedPosts.push(content.id);
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

      return { id: batch.id, status: 'completed' };
    } catch (error) {
      this.logger.error(`Social copy generation failed: ${error instanceof Error ? error.message : error}`);
      batch.errorMessage = error instanceof Error ? error.message : 'Generation failed';
      await this.batches.save(batch);
      return { id: batch.id, status: 'failed' };
    }
  }

  private formatPostBody(post: SocialCopyPost): string {
    const parts = [post.body];
    if (post.hashtags?.length) {
      parts.push('\n\n' + post.hashtags.map((h) => `#${h}`).join(' '));
    }
    return parts.join('');
  }

  private toResponse(entity: CommunityManagerBatchEntity): SocialCopyBatchResponse {
    const data = entity.data as Record<string, unknown>;
    return {
      id: entity.id,
      summary: (data.summary as string) ?? '',
      posts: (entity.posts as unknown as SocialCopyPost[]).map((p) => ({
        id: p.id,
        platform: p.platform,
        title: p.title,
        body: p.body,
        hashtags: p.hashtags,
        visualDescription: p.visualDescription,
        bestTime: p.bestTime,
        targetAudience: p.targetAudience,
        callToAction: p.callToAction,
        tone: p.tone,
        contentId: (p as unknown as Record<string, unknown>).contentId as string | undefined,
      })),
      publishingGuide: (data.publishingGuide as string) ?? '',
      generatedAt: (data.generatedAt as string) ?? entity.createdAt.toISOString(),
      createdAt: entity.createdAt.toISOString(),
    };
  }
}