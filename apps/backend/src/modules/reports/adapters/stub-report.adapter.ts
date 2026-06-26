import { Injectable } from '@nestjs/common';
import {
  GeneratedReportData,
  ReportAdapterPort,
  ReportGenerationContext,
} from './report.adapter.port';
import { REPORT_TYPE_LABELS } from '../domain/report.constants';

@Injectable()
export class StubReportAdapter implements ReportAdapterPort {
  async generate(context: ReportGenerationContext): Promise<GeneratedReportData> {
    const { metrics, type, campaign } = context;
    const typeLabel = REPORT_TYPE_LABELS[type];

    return {
      summary: `${typeLabel}: ${metrics.campaigns.total} campañas, ${metrics.leads.total} leads y ${metrics.contents.total} contenidos analizados${campaign ? ` para "${campaign.name}"` : ''}.`,
      highlights: [
        `${metrics.campaigns.active} campañas activas`,
        `Score medio de leads: ${metrics.leads.averageScore.toFixed(1)}`,
        `${metrics.contents.approved} contenidos aprobados`,
      ],
      metrics: {
        campaignsTotal: metrics.campaigns.total,
        leadsTotal: metrics.leads.total,
        contentsApproved: metrics.contents.approved,
        averageLeadScore: metrics.leads.averageScore,
      },
      recommendations: [
        'Revisar campañas pausadas con bajo rendimiento',
        'Priorizar leads en etapa prospect con score alto',
        'Acelerar aprobación de contenidos pendientes del calendario',
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}
