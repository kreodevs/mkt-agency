import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadEntity } from '../../crm/infrastructure/typeorm/lead.entity';
import { AgentRole } from '../domain/agent-role.enum';
import { AgentEventService } from './agent-event.service';
import { OperatingProfileService } from './operating-profile.service';

export interface LeadPerformanceSummary {
  periodDays: number;
  totalLeads: number;
  bySource: Array<{ source: string; count: number }>;
  byStage: Array<{ stage: string; count: number }>;
}

@Injectable()
export class AnalyticsAgentService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leads: Repository<LeadEntity>,
    private readonly agentEvents: AgentEventService,
    private readonly operatingProfile: OperatingProfileService,
  ) {}

  async getLeadPerformanceSummary(
    tenantId: string,
    productId?: string,
    periodDays = 30,
  ): Promise<LeadPerformanceSummary> {
    const since = new Date();
    since.setDate(since.getDate() - periodDays);

    const qb = this.leads
      .createQueryBuilder('l')
      .where('l.tenant_id = :tenantId', { tenantId })
      .andWhere('l.created_at >= :since', { since });

    if (productId) {
      qb.andWhere('l.product_id = :productId', { productId });
    }

    const rows = await qb.getMany();
    const bySource = new Map<string, number>();
    const byStage = new Map<string, number>();

    for (const lead of rows) {
      const metadata = lead.metadata as Record<string, unknown> | null;
      const source =
        typeof metadata?.utmSource === 'string'
          ? metadata.utmSource
          : typeof metadata?.source === 'string'
            ? metadata.source
            : 'direct';
      bySource.set(source, (bySource.get(source) ?? 0) + 1);
      byStage.set(lead.stage, (byStage.get(lead.stage) ?? 0) + 1);
    }

    return {
      periodDays,
      totalLeads: rows.length,
      bySource: [...bySource.entries()].map(([source, count]) => ({ source, count })),
      byStage: [...byStage.entries()].map(([stage, count]) => ({ stage, count })),
    };
  }

  async publishPerformanceReport(
    tenantId: string,
    productId?: string,
  ): Promise<LeadPerformanceSummary> {
    const summary = await this.getLeadPerformanceSummary(tenantId, productId);
    const profile = await this.operatingProfile.getProfile(tenantId);

    if (this.operatingProfile.canActivateAgent(profile, AgentRole.ANALYTICS)) {
      await this.agentEvents.log({
        tenantId,
        productId: productId ?? null,
        sourceAgent: AgentRole.ANALYTICS,
        targetAgent: AgentRole.STRATEGIST,
        eventType: 'PerformanceReport',
        payload: summary as unknown as Record<string, unknown>,
      });
    }

    return summary;
  }
}
