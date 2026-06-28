import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { LeadEntity } from '../crm/infrastructure/typeorm/lead.entity';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';

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
  ) {}

  @Get('metrics')
  async getMetrics(@CurrentUser() user: AuthenticatedUser) {
    const tenantId = user.tenantId!;

    const [leadCounts, contentCounts, campaignCounts] = await Promise.all([
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

    return {
      leads: {
        total: totalLeads,
        byStage: leadsByStage,
        conversionRate: totalLeads > 0
          ? Math.round(((leadsByStage['client'] ?? 0) / totalLeads) * 100)
          : 0,
      },
      content: {
        total: totalContent,
        byStatus: contentByStatus,
        approvalRate: totalContent > 0
          ? Math.round(((contentByStatus['approved'] ?? 0) / totalContent) * 100)
          : 0,
      },
      campaigns: {
        total: campaignCounts,
      },
    };
  }
}