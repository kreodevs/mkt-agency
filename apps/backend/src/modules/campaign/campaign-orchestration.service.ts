import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AgentCompetitorAnalysisEntity } from '../agents/domain/agent-competitor-analysis.entity';
import { AgentInterviewEntity } from '../agents/domain/agent-interview.entity';
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { CommunityManagerBatchEntity } from '../community-manager/infrastructure/typeorm/community-manager-batch.entity';
import { DEFAULT_CM_PLATFORMS } from '../community-manager/domain/cm-platforms.constants';
import { CompetitorEntity } from '../competitors/infrastructure/typeorm/competitor.entity';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { StrategyAdjustmentEntity } from '../strategy/infrastructure/typeorm/strategy-adjustment.entity';
import { TenantEntity } from '../tenant/infrastructure/typeorm/tenant.entity';
import { PLATFORMS } from './domain/campaign.constants';
import {
  AutoGenerateCampaignResponse,
  CampaignAgentReadinessResponse,
} from './dto/campaign-orchestration.response.dto';
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
    private readonly campaignService: CampaignService,
  ) {}

  async getAgentReadiness(tenantId: string): Promise<CampaignAgentReadinessResponse> {
    const items = await this.buildReadinessItems(tenantId);
    const requiredItems = items.filter((item) => item.required);
    const requiredCompleted = requiredItems.filter((item) => item.complete).length;

    return {
      ready: requiredCompleted === requiredItems.length,
      completed: items.filter((item) => item.complete).length,
      total: items.length,
      requiredCompleted,
      requiredTotal: requiredItems.length,
      items,
      deliverables: [
        'Campaña multicanal en borrador',
        'Estrategia y presupuestos por plataforma (IA)',
        'Contenidos sociales del Community Manager vinculados',
        'Base para calendario y activación en marketing',
      ],
    };
  }

  async autoGenerateFromAgents(tenantId: string): Promise<AutoGenerateCampaignResponse> {
    const readiness = await this.getAgentReadiness(tenantId);
    if (!readiness.ready) {
      throw new BadRequestException({
        error: 'Completa los agentes requeridos antes de generar la campaña automática',
        code: 'AGENTS_NOT_READY',
        readiness,
      });
    }

    const profile = await this.profiles.findOne({ where: { tenantId } });
    const platforms = await this.resolvePlatforms(tenantId);
    const objective = this.buildObjective(profile);
    const companyLabel = profile?.companyName?.trim() || 'Mi empresa';
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

    const strategy = await this.campaignService.requestStrategyGeneration(tenantId, campaign.id);
    const linkedContentCount = await this.linkCommunityContent(tenantId, campaign.id);

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      strategyAssignmentId: strategy.assignmentId,
      strategyStatus: strategy.status,
      linkedContentCount,
      platforms,
      message:
        linkedContentCount > 0
          ? 'Campaña creada con estrategia en generación y contenidos sociales vinculados.'
          : 'Campaña creada con estrategia en generación.',
    };
  }

  private async buildReadinessItems(tenantId: string) {
    const profile = await this.profiles.findOne({ where: { tenantId } });
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

    const objectives = Array.isArray(profile?.objectives) ? profile!.objectives : [];
    const profileComplete =
      !!profile?.companyName?.trim() &&
      !!profile?.industry?.trim() &&
      !!profile?.brandVoice?.trim() &&
      !!profile?.targetAudienceDesc?.trim() &&
      objectives.length > 0;

    return [
      {
        key: 'profile',
        label: 'Perfil de empresa',
        description: 'Nombre, industria, voz, audiencia y objetivos.',
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
        description: 'Análisis estratégico listo o aplicado.',
        complete: !!strategy,
        href: '/strategy',
        required: true,
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

  private buildObjective(profile: CompanyProfileEntity | null): string {
    const objectives = Array.isArray(profile?.objectives) ? profile!.objectives : [];
    if (objectives.length > 0) {
      return `Campaña multicanal alineada a: ${objectives.slice(0, 3).join('; ')}`;
    }
    if (profile?.targetAudienceDesc?.trim()) {
      return `Generar awareness y conversión con ${profile.targetAudienceDesc.trim()}`;
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
