import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { LeadEntity } from '../crm/infrastructure/typeorm/lead.entity';

export interface TenantMetricsSnapshot {
  leads: {
    total: number;
    byStage: Record<string, number>;
    conversionRate: number;
  };
  content: {
    total: number;
    byStatus: Record<string, number>;
    approvalRate: number;
  };
  campaigns: {
    total: number;
    byStatus: Record<string, number>;
    active: number;
  };
  trends: Array<{ month: string; count: number }>;
}

@Injectable()
export class DashboardMetricsService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leads: Repository<LeadEntity>,
    @InjectRepository(ContentEntity)
    private readonly contents: Repository<ContentEntity>,
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
  ) {}

  async collectTenantMetrics(
    tenantId: string,
    productId?: string,
  ): Promise<TenantMetricsSnapshot> {
    const leadQb = this.leads
      .createQueryBuilder('l')
      .select('l.stage', 'stage')
      .addSelect('COUNT(*)', 'count')
      .where('l.tenant_id = :tenantId', { tenantId });

    if (productId) {
      leadQb.andWhere('l.product_id = :productId', { productId });
    }

    const contentQb = this.contents
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('c.tenant_id = :tenantId', { tenantId });

    if (productId) {
      contentQb.andWhere('c.product_id = :productId', { productId });
    }

    const trendQb = this.contents
      .createQueryBuilder('c')
      .select(`to_char(c.created_at, 'YYYY-MM')`, 'month')
      .addSelect('COUNT(*)', 'count')
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere("c.created_at >= NOW() - INTERVAL '12 months'");

    if (productId) {
      trendQb.andWhere('c.product_id = :productId', { productId });
    }

    const [leadCounts, contentCounts, campaignList, contentTrend] = await Promise.all([
      leadQb.groupBy('l.stage').getRawMany<{ stage: string; count: string }>(),
      contentQb.groupBy('c.status').getRawMany<{ status: string; count: string }>(),
      this.campaigns.find({ where: { tenantId } }),
      trendQb.groupBy('month').orderBy('month', 'ASC').getRawMany<{ month: string; count: string }>(),
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
    for (const campaign of campaignList) {
      campaignsByStatus[campaign.status] = (campaignsByStatus[campaign.status] ?? 0) + 1;
    }

    return {
      leads: {
        total: totalLeads,
        byStage: leadsByStage,
        conversionRate:
          totalLeads > 0
            ? Math.round(((leadsByStage['client'] ?? 0) / totalLeads) * 100)
            : 0,
      },
      content: {
        total: totalContent,
        byStatus: contentByStatus,
        approvalRate:
          totalContent > 0
            ? Math.round(((contentByStatus['approved'] ?? 0) / totalContent) * 100)
            : 0,
      },
      campaigns: {
        total: campaignList.length,
        byStatus: campaignsByStatus,
        active:
          (campaignsByStatus['active'] ?? 0) + (campaignsByStatus['running'] ?? 0),
      },
      trends: contentTrend.map((row) => ({ month: row.month, count: Number(row.count) })),
    };
  }
}
