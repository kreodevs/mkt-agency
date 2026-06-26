import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignEntity } from '../../campaign/infrastructure/typeorm/campaign.entity';
import { ContentEntity } from '../../content/infrastructure/typeorm/content.entity';
import { LeadEntity } from '../../crm/infrastructure/typeorm/lead.entity';
import { ReportMetricsSnapshot } from '../adapters/report.adapter.port';

@Injectable()
export class ReportMetricsService {
  constructor(
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
    @InjectRepository(LeadEntity)
    private readonly leads: Repository<LeadEntity>,
    @InjectRepository(ContentEntity)
    private readonly contents: Repository<ContentEntity>,
  ) {}

  async collect(tenantId: string, campaignId?: string): Promise<ReportMetricsSnapshot> {
    const campaignWhere = campaignId
      ? { tenantId, id: campaignId }
      : { tenantId };

    const [campaignList, leadList, contentList] = await Promise.all([
      this.campaigns.find({ where: campaignWhere }),
      this.leads.find({ where: { tenantId } }),
      this.contents.find({
        where: campaignId ? { tenantId, campaignId } : { tenantId },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const campaign of campaignList) {
      byStatus[campaign.status] = (byStatus[campaign.status] ?? 0) + 1;
    }

    const byStage: Record<string, number> = {};
    let scoreSum = 0;
    for (const lead of leadList) {
      byStage[lead.stage] = (byStage[lead.stage] ?? 0) + 1;
      scoreSum += lead.score;
    }

    const approved = contentList.filter((c) => c.status === 'approved').length;
    const pending = contentList.filter(
      (c) => c.status === 'draft' || c.status === 'in_review' || c.status === 'in_changes',
    ).length;

    return {
      campaigns: {
        total: campaignList.length,
        active: campaignList.filter((c) => c.status === 'active').length,
        byStatus,
      },
      leads: {
        total: leadList.length,
        averageScore: leadList.length ? scoreSum / leadList.length : 0,
        byStage,
      },
      contents: {
        total: contentList.length,
        approved,
        pending,
      },
    };
  }
}
