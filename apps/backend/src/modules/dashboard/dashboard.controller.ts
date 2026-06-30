import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { LeadEntity } from '../crm/infrastructure/typeorm/lead.entity';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { StrategyAdjustmentEntity } from '../strategy/infrastructure/typeorm/strategy-adjustment.entity';
import { CommunityManagerBatchEntity } from '../community-manager/infrastructure/typeorm/community-manager-batch.entity';
import { ContentVersionEntity } from '../content/infrastructure/typeorm/content-version.entity';

@Controller('dashboard')
@UseGuards(TenantGuard)
export class DashboardController {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leads: Repository<LeadEntity>,
    @InjectRepository(ContentEntity)
    private readonly contents: Repository<ContentEntity>,
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
    @InjectRepository(StrategyAdjustmentEntity)
    private readonly strategies: Repository<StrategyAdjustmentEntity>,
    @InjectRepository(CommunityManagerBatchEntity)
    private readonly cmBatches: Repository<CommunityManagerBatchEntity>,
    @InjectRepository(ContentVersionEntity)
    private readonly versions: Repository<ContentVersionEntity>,
  ) {}

  @Get('metrics')
  async getMetrics(@CurrentUser() user: AuthenticatedUser) {
    const tenantId = user.tenantId!;

    const [leadCounts, contentCounts, campaignCounts, contentTrend, campaignStatusCounts] =
      await Promise.all([
        this.leads
          .createQueryBuilder('l')
          .select('l.stage', 'stage')
          .addSelect('COUNT(*)', 'count')
          .where('l.tenant_id = :tenantId', { tenantId })
          .groupBy('l.stage')
          .getRawMany<{ stage: string; count: string }>(),
        this.contents
          .createQueryBuilder('c')
          .select('c.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .where('c.tenant_id = :tenantId', { tenantId })
          .groupBy('c.status')
          .getRawMany<{ status: string; count: string }>(),
        this.campaigns.count({ where: { tenantId } }),
        this.contents
          .createQueryBuilder('c')
          .select(`to_char(c.created_at, 'YYYY-MM')`, 'month')
          .addSelect('COUNT(*)', 'count')
          .where('c.tenant_id = :tenantId', { tenantId })
          .andWhere("c.created_at >= NOW() - INTERVAL '12 months'")
          .groupBy('month')
          .orderBy('month', 'ASC')
          .getRawMany<{ month: string; count: string }>(),
        this.campaigns
          .createQueryBuilder('c')
          .select('c.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .where('c.tenant_id = :tenantId', { tenantId })
          .groupBy('c.status')
          .getRawMany<{ status: string; count: string }>(),
      ]);

    const leadsByStage: Record<string, number> = {};
    let totalLeads = 0;
    for (const row of leadCounts) {
      leadsByStage[row.stage] = Number(row.count);
      totalLeads += Number(row.count);
    }

    const contentByStatus: Record<string, number> = {};
    let totalContent = 0;
    for (const row of contentCounts) {
      contentByStatus[row.status] = Number(row.count);
      totalContent += Number(row.count);
    }

    const campaignsByStatus: Record<string, number> = {};
    let totalCampaigns = 0;
    for (const row of campaignStatusCounts) {
      campaignsByStatus[row.status] = Number(row.count);
      totalCampaigns += Number(row.count);
    }

    const trend = contentTrend.map((r) => ({
      month: r.month,
      count: Number(r.count),
    }));

    return {
      leads: {
        total: totalLeads,
        byStage: leadsByStage,
        conversionRate: totalLeads > 0
          ? Math.round(((leadsByStage['client'] ?? 0) / totalLeads) * 100)
          : 0,
        funnel: [
          { stage: 'prospect', label: 'Prospectos', value: leadsByStage['prospect'] ?? 0 },
          { stage: 'contacted', label: 'Contactados', value: leadsByStage['contacted'] ?? 0 },
          { stage: 'interested', label: 'Interesados', value: leadsByStage['interested'] ?? 0 },
          { stage: 'trial', label: 'En prueba', value: leadsByStage['trial'] ?? 0 },
          { stage: 'client', label: 'Clientes', value: leadsByStage['client'] ?? 0 },
        ],
      },
      content: {
        total: totalContent,
        byStatus: contentByStatus,
        approvalRate: totalContent > 0
          ? Math.round(((contentByStatus['approved'] ?? 0) / totalContent) * 100)
          : 0,
        trend,
      },
      campaigns: {
        total: campaignCounts,
        byStatus: campaignsByStatus,
        active: (campaignsByStatus['active'] ?? 0) + (campaignsByStatus['running'] ?? 0),
      },
    };
  }

  @Get('agency-home')
  async getAgencyHome(@CurrentUser() user: AuthenticatedUser) {
    const tenantId = user.tenantId!;
    const today = new Date().toISOString().split('T')[0];

    const [nextContent, latestStrategy, latestCmBatch] = await Promise.all([
      this.contents
        .createQueryBuilder('c')
        .where('c.tenant_id = :tenantId', { tenantId })
        .andWhere('c.scheduled_date IS NOT NULL')
        .andWhere('c.scheduled_date >= :today', { today })
        .orderBy('c.scheduled_date', 'ASC')
        .take(5)
        .getMany(),

      // Latest strategy analysis
      this.strategies.findOne({
        where: { tenantId },
        order: { createdAt: 'DESC' },
      }),

      // Latest CM batch
      this.cmBatches.findOne({
        where: { tenantId },
        order: { createdAt: 'DESC' },
      }),

      // Lead count today
      this.leads.count({
        where: {
          tenantId,
          createdAt: new Date(new Date().setHours(0, 0, 0, 0)),
        } as unknown as Record<string, unknown>,
      }),
    ]);

    // Get latest version bodies for next content items
    const upcoming = await Promise.all(
      nextContent.map(async (c) => {
        const version = c.currentVersionId
          ? await this.versions.findOne({ where: { id: c.currentVersionId } })
          : null;
        return {
          id: c.id,
          title: c.title,
          type: c.type,
          status: c.status,
          scheduledDate: c.scheduledDate,
          preview: version?.body ? (version.body.length > 150 ? `${version.body.slice(0, 150)}…` : version.body) : null,
        };
      }),
    );

    // Lead count (approximate — use today's creations)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const leadsToday = await this.leads.count({
      where: { tenantId, createdAt: todayStart } as unknown as Record<string, unknown>,
    });

    // Count total leads
    const totalLeads = await this.leads.count({ where: { tenantId } });
    const clientLeads = await this.leads.count({ where: { tenantId, stage: 'client' } as unknown as Record<string, unknown> });

    const strategyData = latestStrategy?.data as Record<string, unknown> | undefined;

    return {
      upcoming,
      strategy: latestStrategy
        ? {
            id: latestStrategy.id,
            status: latestStrategy.status,
            summary: strategyData?.summary as string | undefined,
            overallHealth: strategyData?.overallHealth as string | undefined,
            suggestionsCount: (latestStrategy.suggestions as Array<Record<string, unknown>>)?.filter(
              (s) => s.status === 'pending',
            ).length ?? 0,
            createdAt: latestStrategy.createdAt.toISOString(),
          }
        : null,
      communityBatch: latestCmBatch
        ? {
            id: latestCmBatch.id,
            postsCount: (latestCmBatch.posts as Array<Record<string, unknown>>)?.length ?? 0,
            summary: ((latestCmBatch.data as Record<string, unknown>)?.summary as string) ?? '',
            createdAt: latestCmBatch.createdAt.toISOString(),
          }
        : null,
      leads: {
        today: leadsToday,
        total: totalLeads,
        clients: clientLeads,
        conversionRate: totalLeads > 0 ? Math.round((clientLeads / totalLeads) * 100) : 0,
      },
    };
  }
}