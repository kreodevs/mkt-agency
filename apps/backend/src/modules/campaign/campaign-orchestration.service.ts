import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AgentCompetitorAnalysisEntity } from '../agents/domain/agent-competitor-analysis.entity';
import { AgentInterviewEntity } from '../agents/domain/agent-interview.entity';
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { CompanyProfileSectionEntity } from '../company-profile/infrastructure/typeorm/company-profile-section.entity';
import {
  isCompanyProfileReady,
  ProfileSectionSyncService,
  ResolvedProfileValues,
} from '../company-profile/services/profile-section-sync.service';
import { CommunityManagerBatchEntity } from '../community-manager/infrastructure/typeorm/community-manager-batch.entity';
import { DEFAULT_CM_PLATFORMS } from '../community-manager/domain/cm-platforms.constants';
import { CompetitorEntity } from '../competitors/infrastructure/typeorm/competitor.entity';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { StrategyAdjustmentEntity } from '../strategy/infrastructure/typeorm/strategy-adjustment.entity';
import { TenantEntity } from '../tenant/infrastructure/typeorm/tenant.entity';
import { PLATFORMS } from './domain/campaign.constants';
import {
  CampaignExecutionMode,
  DEFAULT_CAMPAIGN_EXECUTION_MODE,
} from './domain/campaign-execution-mode.constants';
import { AutoGenerateCampaignDto } from './dto/campaign-orchestration.request.dto';
import {
  AutoGenerateCampaignResponse,
  CampaignAgentReadinessResponse,
} from './dto/campaign-orchestration.response.dto';
import { CampaignEntity } from './infrastructure/typeorm/campaign.entity';
import { CampaignService } from './campaign.service';

const CM_TO_CAMPAIGN_PLATFORM: Record<string, string> = {
  instagram: 'instagram',
  linkedin: 'linkedin',
  facebook: 'facebook',
  tiktok: 'tiktok',
  twitter: 'linkedin',
};

@Injectable()
export class CampaignOrchestrationService {
  constructor(
    @InjectRepository(CompanyProfileEntity)
    private readonly profiles: Repository<CompanyProfileEntity>,
    @InjectRepository(CompanyProfileSectionEntity)
    private readonly profileSections: Repository<CompanyProfileSectionEntity>,
    @InjectRepository(AgentInterviewEntity)
    private readonly interviews: Repository<AgentInterviewEntity>,
    @InjectRepository(CommunityManagerBatchEntity)
    private readonly cmBatches: Repository<CommunityManagerBatchEntity>,
    @InjectRepository(StrategyAdjustmentEntity)
    private readonly strategyAdjustments: Repository<StrategyAdjustmentEntity>,
    @InjectRepository(CompetitorEntity)
    private readonly competitors: Repository<CompetitorEntity>,
    @InjectRepository(AgentCompetitorAnalysisEntity)
    private readonly competitorAnalyses: Repository<AgentCompetitorAnalysisEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(ContentEntity)
    private readonly contents: Repository<ContentEntity>,
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
    private readonly campaignService: CampaignService,
    private readonly profileSectionSync: ProfileSectionSyncService,
  ) {}

  async getAgentReadiness(
    tenantId: string,
    mode: CampaignExecutionMode = DEFAULT_CAMPAIGN_EXECUTION_MODE,
  ): Promise<CampaignAgentReadinessResponse> {
    const items = await this.buildReadinessItems(tenantId, mode);
    const requiredItems = items.filter((item) => item.required);
    const requiredCompleted = requiredItems.filter((item) => item.complete).length;

    return {
      ready: requiredCompleted === requiredItems.length,
      mode,
      completed: items.filter((item) => item.complete).length,
      total: items.length,
      requiredCompleted,
      requiredTotal: requiredItems.length,
      items,
      deliverables: this.deliverablesForMode(mode),
    };
  }

  async autoGenerateFromAgents(
    tenantId: string,
    dto: AutoGenerateCampaignDto = {},
  ): Promise<AutoGenerateCampaignResponse> {
    const mode = dto.mode ?? DEFAULT_CAMPAIGN_EXECUTION_MODE;
    const readiness = await this.getAgentReadiness(tenantId, mode);
    if (!readiness.ready) {
      throw new BadRequestException({
        error: 'Completa los agentes requeridos antes de generar la campaña automática',
        code: 'AGENTS_NOT_READY',
        readiness,
      });
    }

    const profile = await this.profiles.findOne({ where: { tenantId } });
    const platforms = await this.resolvePlatforms(tenantId);
    const profileSections = profile
      ? await this.profileSections.find({ where: { profileId: profile.id } })
      : [];
    const resolvedProfile = this.profileSectionSync.resolveProfileValues(profile, profileSections);
    const objective = this.buildObjective(resolvedProfile);
    const companyLabel = resolvedProfile.companyName?.trim() || 'Mi empresa';
    const dateLabel = new Intl.DateTimeFormat('es-MX', {
      month: 'short',
      year: 'numeric',
    }).format(new Date());
    const name = `${companyLabel} — Campaña IA ${dateLabel}`;

    const campaign = await this.campaignService.create(tenantId, {
      name,
      objective,
      platforms,
    });

    const linkedContentCount = await this.linkCommunityContent(tenantId, campaign.id);

    if (mode === 'organic') {
      await this.applyOrganicStrategy(tenantId, campaign.id, platforms, linkedContentCount);

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        executionMode: mode,
        strategyAssignmentId: null,
        strategyStatus: null,
        linkedContentCount,
        platforms,
        message:
          linkedContentCount > 0
            ? 'Campaña editorial creada. Revisa el calendario, aprueba y publica manualmente con Copiar y Llevar.'
            : 'Campaña editorial creada. Genera copy en Community Manager y vincúlalo al calendario.',
      };
    }

    const strategy = await this.campaignService.requestStrategyGeneration(tenantId, campaign.id);
    await this.markCampaignExecutionMode(campaign.id, 'paid');

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      executionMode: mode,
      strategyAssignmentId: strategy.assignmentId,
      strategyStatus: strategy.status,
      linkedContentCount,
      platforms,
      message:
        linkedContentCount > 0
          ? 'Campaña de medios pagados creada con estrategia en generación y contenidos vinculados.'
          : 'Campaña de medios pagados creada con estrategia en generación.',
    };
  }

  private deliverablesForMode(mode: CampaignExecutionMode): string[] {
    if (mode === 'paid') {
      return [
        'Campaña multicanal en borrador',
        'Estrategia y presupuestos por plataforma (IA)',
        'Contenidos vinculados para creatividades',
        'Base para configurar anuncios en Meta/Google/LinkedIn',
      ];
    }

    return [
      'Campaña editorial en borrador',
      'Posts del Community Manager en calendario',
      'Guía de publicación en lenguaje de negocio',
      'Flujo aprobar → Copiar y Llevar → publicar tú mismo en redes',
    ];
  }

  private async applyOrganicStrategy(
    tenantId: string,
    campaignId: string,
    platforms: string[],
    linkedContentCount: number,
  ): Promise<void> {
    const batch = await this.cmBatches.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    const data = (batch?.data ?? {}) as Record<string, unknown>;
    const publishingGuide =
      (typeof data.publishingGuide === 'string' && data.publishingGuide) ||
      'Publica en tus redes en el horario sugerido. Copia el texto, adjunta la imagen si aplica y revisa antes de publicar.';

    const campaign = await this.campaigns.findOne({ where: { id: campaignId, tenantId } });
    if (!campaign) {
      return;
    }

    campaign.strategy = {
      executionMode: 'organic',
      summary:
        (typeof data.summary === 'string' && data.summary) ||
        `Plan editorial para ${platforms.join(', ')} con publicación manual.`,
      publishingGuide,
      workflow: 'calendar_approval_copy_paste',
      channels: platforms.map((platform) => ({
        platform,
        focus: 'Publicación orgánica manual (sin Ads Manager)',
      })),
      timeline: 'Revisa en Calendario → Aprueba → Copia y publica en cada red',
      kpis: ['Consistencia de publicación', 'Engagement', 'Leads cualificados'],
      linkedContentCount,
    };
    await this.campaigns.save(campaign);
  }

  private async markCampaignExecutionMode(
    campaignId: string,
    mode: CampaignExecutionMode,
  ): Promise<void> {
    const campaign = await this.campaigns.findOne({ where: { id: campaignId } });
    if (!campaign) {
      return;
    }
    campaign.strategy = { ...campaign.strategy, executionMode: mode };
    await this.campaigns.save(campaign);
  }

  private async buildReadinessItems(tenantId: string, mode: CampaignExecutionMode) {
    const profile = await this.profiles.findOne({ where: { tenantId } });
    const sections = profile
      ? await this.profileSections.find({ where: { profileId: profile.id } })
      : [];
    const resolvedProfile = this.profileSectionSync.resolveProfileValues(profile, sections);
    const profileComplete = isCompanyProfileReady(profile, sections, resolvedProfile);
    const brandWithBrief = await this.interviews
      .createQueryBuilder('i')
      .where('i.tenant_id = :tenantId', { tenantId })
      .andWhere('i.agent_type = :type', { type: 'brand_interview' })
      .andWhere(
        "(i.status = 'completed' OR (i.status = 'failed' AND (i.brand_brief_markdown IS NOT NULL OR i.brand_brief IS NOT NULL)))",
      )
      .orderBy('i.updated_at', 'DESC')
      .getOne();

    const cmBatch = await this.cmBatches.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    const cmPosts = (cmBatch?.posts as Array<{ contentId?: string }> | undefined) ?? [];
    const hasCmContent = cmPosts.length > 0;

    const strategy = await this.strategyAdjustments.findOne({
      where: { tenantId, status: In(['ready', 'applied']) },
      order: { createdAt: 'DESC' },
    });

    const competitorCount = await this.competitors.count({ where: { tenantId } });
    const competitorAnalysis = await this.competitorAnalyses.findOne({
      where: { tenantId, status: 'completed' },
      order: { createdAt: 'DESC' },
    });

    return [
      {
        key: 'profile',
        label: 'Perfil de empresa',
        description: 'Onboarding completado: empresa, industria, web, voz y audiencia.',
        complete: profileComplete,
        href: '/onboarding',
        required: true,
      },
      {
        key: 'brand_analyst',
        label: 'Brand Analyst',
        description: 'Brand Brief generado a partir de la entrevista.',
        complete: !!brandWithBrief,
        href: '/agents/brand-interview',
        required: true,
      },
      {
        key: 'community_manager',
        label: 'Community Manager',
        description: 'Al menos un batch de copy para redes generado.',
        complete: hasCmContent,
        href: '/community',
        required: true,
      },
      {
        key: 'strategy',
        label: 'Estrategia',
        description: 'Análisis estratégico listo o aplicado (solo campañas pagadas).',
        complete: !!strategy,
        href: '/strategy',
        required: mode === 'paid',
      },
      {
        key: 'competitors',
        label: 'Inteligencia competitiva',
        description: 'Competidores registrados o análisis Competitor Intel.',
        complete: competitorCount > 0 || !!competitorAnalysis,
        href: '/agents/competitor-intel',
        required: false,
      },
    ];
  }

  private async resolvePlatforms(tenantId: string): Promise<string[]> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    const stored = (tenant?.settings?.communityManager ?? {}) as Record<string, unknown>;
    const cmPlatforms = Array.isArray(stored.platforms)
      ? (stored.platforms as string[])
      : [...DEFAULT_CM_PLATFORMS];

    const allowed = new Set<string>(PLATFORMS);
    const mapped = [
      ...new Set(
        cmPlatforms
          .map((platform) => CM_TO_CAMPAIGN_PLATFORM[platform] ?? platform)
          .filter((platform) => allowed.has(platform)),
      ),
    ];

    if (mapped.length > 0) {
      return mapped;
    }

    return ['instagram', 'linkedin', 'google'];
  }

  private buildObjective(values: ResolvedProfileValues): string {
    if (values.objectives.length > 0) {
      return `Campaña multicanal alineada a: ${values.objectives.slice(0, 3).join('; ')}`;
    }
    if (values.targetAudienceDesc?.trim()) {
      return `Generar awareness y conversión con ${values.targetAudienceDesc.trim()}`;
    }
    return 'Campaña multicanal generada automáticamente a partir del contexto de agentes IA';
  }

  private async linkCommunityContent(tenantId: string, campaignId: string): Promise<number> {
    const batch = await this.cmBatches.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    if (!batch) {
      return 0;
    }

    const posts = (batch.posts as Array<{ contentId?: string }> | undefined) ?? [];
    const contentIds = posts
      .map((post) => post.contentId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    if (contentIds.length === 0) {
      return 0;
    }

    const result = await this.contents
      .createQueryBuilder()
      .update(ContentEntity)
      .set({ campaignId })
      .where('tenant_id = :tenantId', { tenantId })
      .andWhere('id IN (:...contentIds)', { contentIds })
      .execute();

    return result.affected ?? 0;
  }
}
