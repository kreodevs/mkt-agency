import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadEntity } from '../../crm/infrastructure/typeorm/lead.entity';
import { AgentRole } from '../domain/agent-role.enum';
import { AgentEventService } from './agent-event.service';
import { OperatingProfileService } from './operating-profile.service';
import { AdPerformanceImportService } from './ad-performance-import.service';

export interface LeadPerformanceSummary {
  periodDays: number;
  totalLeads: number;
  bySource: Array<{ source: string; count: number }>;
  byStage: Array<{ stage: string; count: number }>;
}

export interface AnomalyAlert {
  type: 'conversion_drop' | 'lead_spike' | 'source_gap';
  severity: 'warning' | 'critical';
  evidence: Record<string, number>;
  recommendation: string;
}

export type AttributionModel = 'first_touch' | 'last_touch';

export interface AttributionReport {
  model: AttributionModel;
  periodDays: number;
  totalLeads: number;
  byChannel: Array<{ channel: string; count: number; share: number }>;
}

export interface PaidPerformanceCrossSummary {
  periodDays: number;
  ads: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    importCount: number;
  };
  leads: {
    attributedPaidLeads: number;
    totalLeads: number;
  };
  metrics: {
    costPerLead: number | null;
    costPerClick: number | null;
  };
}

@Injectable()
export class AnalyticsAgentService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leads: Repository<LeadEntity>,
    private readonly agentEvents: AgentEventService,
    private readonly operatingProfile: OperatingProfileService,
    private readonly adImports: AdPerformanceImportService,
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

  async detectAnomalies(tenantId: string, productId?: string): Promise<AnomalyAlert[]> {
    const current = await this.countLeadsInWindow(tenantId, productId, 7, 0);
    const previous = await this.countLeadsInWindow(tenantId, productId, 7, 7);

    const alerts: AnomalyAlert[] = [];

    if (previous > 0 && current < previous * 0.5) {
      alerts.push({
        type: 'conversion_drop',
        severity: current === 0 ? 'critical' : 'warning',
        evidence: { currentWeek: current, previousWeek: previous },
        recommendation: 'investigate',
      });
    }

    if (previous > 0 && current > previous * 2) {
      alerts.push({
        type: 'lead_spike',
        severity: 'warning',
        evidence: { currentWeek: current, previousWeek: previous },
        recommendation: 'reallocate',
      });
    }

    const socialCurrent = await this.countLeadsBySource(tenantId, productId, 'social', 7);
    const formCurrent = await this.countLeadsBySource(tenantId, productId, 'direct', 7);
    if (socialCurrent > 0 && formCurrent === 0 && current > 3) {
      alerts.push({
        type: 'source_gap',
        severity: 'warning',
        evidence: { socialLeads: socialCurrent, formLeads: formCurrent },
        recommendation: 'investigate',
      });
    }

    return alerts;
  }

  async getAttributionReport(
    tenantId: string,
    model: AttributionModel = 'last_touch',
    productId?: string,
    periodDays = 30,
  ): Promise<AttributionReport> {
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
    const counts = new Map<string, number>();

    for (const lead of rows) {
      const metadata = lead.metadata as Record<string, unknown> | null;
      const channel = this.resolveAttributionChannel(metadata, model);
      counts.set(channel, (counts.get(channel) ?? 0) + 1);
    }

    const totalLeads = rows.length;
    const byChannel = [...counts.entries()]
      .map(([channel, count]) => ({
        channel,
        count,
        share: totalLeads > 0 ? Math.round((count / totalLeads) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { model, periodDays, totalLeads, byChannel };
  }

  async getPaidPerformanceCrossSummary(
    tenantId: string,
    productId?: string,
    periodDays = 30,
  ): Promise<PaidPerformanceCrossSummary> {
    const since = new Date();
    since.setDate(since.getDate() - periodDays);

    const [adsTotals, leadRows] = await Promise.all([
      this.adImports.aggregateTotalsSince(tenantId, since, productId),
      this.fetchLeadsSince(tenantId, since, productId),
    ]);

    const attributedPaidLeads = leadRows.filter((lead) =>
      this.isPaidAttributedLead(lead.metadata as Record<string, unknown> | null),
    ).length;

    const costPerLead =
      attributedPaidLeads > 0 && adsTotals.spend > 0
        ? Math.round((adsTotals.spend / attributedPaidLeads) * 100) / 100
        : null;
    const costPerClick =
      adsTotals.clicks > 0 && adsTotals.spend > 0
        ? Math.round((adsTotals.spend / adsTotals.clicks) * 100) / 100
        : null;

    return {
      periodDays,
      ads: adsTotals,
      leads: {
        attributedPaidLeads,
        totalLeads: leadRows.length,
      },
      metrics: {
        costPerLead,
        costPerClick,
      },
    };
  }

  private async fetchLeadsSince(
    tenantId: string,
    since: Date,
    productId?: string,
  ): Promise<LeadEntity[]> {
    const qb = this.leads
      .createQueryBuilder('l')
      .where('l.tenant_id = :tenantId', { tenantId })
      .andWhere('l.created_at >= :since', { since });

    if (productId) {
      qb.andWhere('l.product_id = :productId', { productId });
    }

    return qb.getMany();
  }

  private isPaidAttributedLead(metadata: Record<string, unknown> | null): boolean {
    if (!metadata) return false;

    const medium = String(metadata.utm_medium ?? metadata.utmMedium ?? '').toLowerCase();
    const paidMediums = ['cpc', 'ppc', 'paid', 'paid_social', 'paidsocial'];
    if (paidMediums.includes(medium)) {
      return true;
    }

    const source = String(
      metadata.utm_source ?? metadata.utmSource ?? metadata.source ?? '',
    ).toLowerCase();
    const paidSources = ['facebook', 'instagram', 'meta', 'google', 'google_ads', 'fb', 'ig'];
    if (!paidSources.includes(source)) {
      return false;
    }

    return medium !== 'organic' && medium !== 'referral' && medium !== 'social';
  }

  private resolveAttributionChannel(
    metadata: Record<string, unknown> | null,
    model: AttributionModel,
  ): string {
    if (!metadata) return 'direct';

    if (model === 'first_touch') {
      if (typeof metadata.firstTouchSource === 'string') return metadata.firstTouchSource;
      if (typeof metadata.firstTouch === 'string') return metadata.firstTouch;
    } else {
      if (typeof metadata.lastTouchSource === 'string') return metadata.lastTouchSource;
      if (typeof metadata.lastTouch === 'string') return metadata.lastTouch;
      if (typeof metadata.utmSource === 'string') return metadata.utmSource;
    }

    if (typeof metadata.source === 'string') return metadata.source;
    if (typeof metadata.platform === 'string') return metadata.platform;
    return 'direct';
  }

  private async countLeadsInWindow(
    tenantId: string,
    productId: string | undefined,
    days: number,
    offsetDays: number,
  ): Promise<number> {
    const end = new Date();
    end.setDate(end.getDate() - offsetDays);
    const start = new Date(end);
    start.setDate(start.getDate() - days);

    const qb = this.leads
      .createQueryBuilder('l')
      .where('l.tenant_id = :tenantId', { tenantId })
      .andWhere('l.created_at >= :start AND l.created_at < :end', { start, end });

    if (productId) {
      qb.andWhere('l.product_id = :productId', { productId });
    }

    return qb.getCount();
  }

  private async countLeadsBySource(
    tenantId: string,
    productId: string | undefined,
    source: string,
    days: number,
  ): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const qb = this.leads
      .createQueryBuilder('l')
      .where('l.tenant_id = :tenantId', { tenantId })
      .andWhere('l.created_at >= :since', { since })
      .andWhere(`l.metadata->>'source' = :source`, { source });

    if (productId) {
      qb.andWhere('l.product_id = :productId', { productId });
    }

    return qb.getCount();
  }
}
