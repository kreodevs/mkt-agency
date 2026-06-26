import type { ReportType } from '../domain/report.constants';

export interface ReportMetricsSnapshot {
  campaigns: {
    total: number;
    active: number;
    byStatus: Record<string, number>;
  };
  leads: {
    total: number;
    averageScore: number;
    byStage: Record<string, number>;
  };
  contents: {
    total: number;
    approved: number;
    pending: number;
  };
}

export interface ReportGenerationContext {
  tenantId: string;
  type: ReportType;
  config: Record<string, unknown>;
  metrics: ReportMetricsSnapshot;
  campaign: {
    id: string;
    name: string;
    objective: string | null;
    status: string;
    platforms: string[];
  } | null;
}

export interface GeneratedReportData {
  summary: string;
  highlights: string[];
  metrics: Record<string, number | string>;
  recommendations: string[];
  generatedAt: string;
}

export interface ReportAdapterPort {
  generate(context: ReportGenerationContext): Promise<GeneratedReportData>;
}

export const REPORT_ADAPTER = Symbol('REPORT_ADAPTER');
