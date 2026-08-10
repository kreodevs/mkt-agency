import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { LlmClient } from '../../../shared/ai/llm.client';
import { runWithLlmUsageContext } from '../../../shared/ai/llm-usage.context';
import { AgentRole } from '../domain/agent-role.enum';
import type { ExecutiveWeeklyReportPayload } from '../domain/executive-report.types';
import { AgentEventLogEntity } from '../infrastructure/typeorm/agent-event-log.entity';
import { AgentEventService } from './agent-event.service';
import { AnalyticsAgentService } from './analytics-agent.service';

const REPORT_PERIOD_DAYS = 7;

export interface GenerateExecutiveReportOptions {
  notifyOwner?: boolean;
  onGenerated?: (report: ExecutiveWeeklyReportPayload) => Promise<void>;
}

@Injectable()
export class ExecutiveReportService {
  private readonly logger = new Logger(ExecutiveReportService.name);

  constructor(
    @InjectRepository(AgentEventLogEntity)
    private readonly events: Repository<AgentEventLogEntity>,
    private readonly analytics: AnalyticsAgentService,
    private readonly agentEvents: AgentEventService,
    private readonly llm: LlmClient,
  ) {}

  async generateForTenant(
    tenantId: string,
    productId?: string,
    options: GenerateExecutiveReportOptions = {},
  ): Promise<ExecutiveWeeklyReportPayload> {
    return runWithLlmUsageContext({ tenantId }, async () => {
      const [leads, paid, anomalies, attribution] = await Promise.all([
        this.analytics.getLeadPerformanceSummary(tenantId, productId, REPORT_PERIOD_DAYS),
        this.analytics.getPaidPerformanceCrossSummary(tenantId, productId, REPORT_PERIOD_DAYS),
        this.analytics.detectAnomalies(tenantId, productId),
        this.analytics.getAttributionReport(tenantId, 'last_touch', productId, REPORT_PERIOD_DAYS),
      ]);

      const report = await this.buildReport({
        leads,
        paid,
        anomalies,
        attribution,
      });

      await this.agentEvents.log({
        tenantId,
        productId: productId ?? null,
        sourceAgent: AgentRole.ANALYTICS,
        targetAgent: AgentRole.STRATEGIST,
        eventType: 'ExecutiveWeeklyReport',
        payload: report as unknown as Record<string, unknown>,
      });

      if (options.onGenerated) {
        await options.onGenerated(report);
      }

      return report;
    });
  }

  async getLatest(
    tenantId: string,
    productId?: string,
  ): Promise<ExecutiveWeeklyReportPayload | null> {
    const qb = this.events
      .createQueryBuilder('e')
      .where('e.tenant_id = :tenantId', { tenantId })
      .andWhere('e.event_type = :eventType', { eventType: 'ExecutiveWeeklyReport' })
      .orderBy('e.created_at', 'DESC')
      .take(1);

    if (productId) {
      qb.andWhere('e.product_id = :productId', { productId });
    }

    const row = await qb.getOne();
    if (!row?.payload) {
      return null;
    }

    return row.payload as unknown as ExecutiveWeeklyReportPayload;
  }

  private async buildReport(input: {
    leads: Awaited<ReturnType<AnalyticsAgentService['getLeadPerformanceSummary']>>;
    paid: Awaited<ReturnType<AnalyticsAgentService['getPaidPerformanceCrossSummary']>>;
    anomalies: Awaited<ReturnType<AnalyticsAgentService['detectAnomalies']>>;
    attribution: Awaited<ReturnType<AnalyticsAgentService['getAttributionReport']>>;
  }): Promise<ExecutiveWeeklyReportPayload> {
    const generatedAt = new Date().toISOString();

    try {
      const llmConfigured = await this.llm.isConfigured();
      if (llmConfigured) {
        const result = await this.llm.chatJson<ExecutiveWeeklyReportPayload>(
          'Eres el director de marketing de una PYME. Responde SOLO JSON válido con la forma: ' +
            '{"headline":"...","executiveSummary":"...","keyMetrics":{"clave":number|string},' +
            '"paidMediaInsight":"..."|null,' +
            '"suggestions":[{"id":"uuid","action":"...","rationale":"...","priority":"high|medium|low","requiresApproval":true}]}. ' +
            'Español neutro, tono ejecutivo breve. Máximo 4 sugerencias accionables que el dueño debe aprobar manualmente — nunca propongas publicar o gastar automáticamente.',
          JSON.stringify({
            periodDays: REPORT_PERIOD_DAYS,
            leads: input.leads,
            paidMedia: input.paid,
            anomalies: input.anomalies,
            attribution: input.attribution,
          }),
          { taskType: 'report_generation' },
        );

        if (result?.headline && result.executiveSummary && Array.isArray(result.suggestions)) {
          return {
            periodDays: REPORT_PERIOD_DAYS,
            generatedAt,
            headline: result.headline,
            executiveSummary: result.executiveSummary,
            keyMetrics: result.keyMetrics ?? {},
            paidMediaInsight: result.paidMediaInsight ?? null,
            suggestions: result.suggestions.map((item) => ({
              id: item.id || randomUUID(),
              action: item.action,
              rationale: item.rationale,
              priority: item.priority ?? 'medium',
              requiresApproval: true as const,
            })),
          };
        }
      }
    } catch (error) {
      this.logger.warn('Executive report LLM fallback', error);
    }

    return this.fallbackReport(input, generatedAt);
  }

  private fallbackReport(
    input: {
      leads: Awaited<ReturnType<AnalyticsAgentService['getLeadPerformanceSummary']>>;
      paid: Awaited<ReturnType<AnalyticsAgentService['getPaidPerformanceCrossSummary']>>;
      anomalies: Awaited<ReturnType<AnalyticsAgentService['detectAnomalies']>>;
      attribution: Awaited<ReturnType<AnalyticsAgentService['getAttributionReport']>>;
    },
    generatedAt: string,
  ): ExecutiveWeeklyReportPayload {
    const topChannel = input.attribution.byChannel[0];
    const suggestions: ExecutiveWeeklyReportPayload['suggestions'] = [];

    if (input.anomalies.length > 0) {
      for (const alert of input.anomalies.slice(0, 2)) {
        suggestions.push({
          id: randomUUID(),
          action:
            alert.type === 'conversion_drop'
              ? 'Revisa y repite el ángulo creativo de la semana pasada con mejor rendimiento'
              : alert.type === 'lead_spike'
                ? 'Documenta qué publicación o campaña disparó los leads para repetir el patrón'
                : 'Refuerza el canal de captación de formularios además de redes sociales',
          rationale: alert.recommendation,
          priority: alert.severity === 'critical' ? 'high' : 'medium',
          requiresApproval: true,
        });
      }
    }

    if (input.paid.ads.spend > 0 && input.paid.metrics.costPerLead != null) {
      suggestions.push({
        id: randomUUID(),
        action: 'Compara CPL actual con tu objetivo y ajusta copy o audiencia antes de subir presupuesto',
        rationale: `CPL estimado: $${input.paid.metrics.costPerLead} con ${input.paid.leads.attributedPaidLeads} lead(s) atribuido(s).`,
        priority: 'medium',
        requiresApproval: true,
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        id: randomUUID(),
        action: 'Mantén el ritmo de publicaciones aprobadas y revisa la bandeja de la próxima semana',
        rationale: `${input.leads.totalLeads} lead(s) en los últimos ${REPORT_PERIOD_DAYS} días.`,
        priority: 'low',
        requiresApproval: true,
      });
    }

    const paidLine =
      input.paid.ads.importCount > 0
        ? `Gasto en pauta: $${input.paid.ads.spend}; CPL: ${input.paid.metrics.costPerLead ?? 'sin datos'}.`
        : null;

    return {
      periodDays: REPORT_PERIOD_DAYS,
      generatedAt,
      headline: `Semana: ${input.leads.totalLeads} leads · ${input.anomalies.length} alerta(s)`,
      executiveSummary: [
        `En ${REPORT_PERIOD_DAYS} días registraste ${input.leads.totalLeads} lead(s).`,
        topChannel ? `Canal principal (${input.attribution.model}): ${topChannel.channel} (${topChannel.share}%).` : null,
        paidLine,
      ]
        .filter(Boolean)
        .join(' '),
      keyMetrics: {
        leads: input.leads.totalLeads,
        anomalies: input.anomalies.length,
        adSpend: input.paid.ads.spend,
        costPerLead: input.paid.metrics.costPerLead ?? 'n/a',
      },
      paidMediaInsight: paidLine,
      suggestions,
      fallback: true,
    };
  }
}
