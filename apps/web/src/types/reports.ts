export type ReportType = 'campaign_performance' | 'lead_analytics';

export type ReportStatus = 'generating' | 'completed' | 'failed';

export interface ReportConfig {
  campaignId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ReportData {
  summary?: string;
  highlights?: string[];
  metrics?: Record<string, number | string>;
  recommendations?: string[];
  generatedAt?: string;
  error?: string;
  snapshot?: Record<string, unknown>;
}

export interface Report {
  id: string;
  tenantId: string;
  type: ReportType;
  config: ReportConfig;
  data: ReportData;
  generatedBy: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedReportsResponse {
  items: Report[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateReportPayload {
  type: ReportType;
  config?: ReportConfig;
}

export interface CreateReportResponse {
  id: string;
  status: ReportStatus;
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  campaign_performance: 'Rendimiento de campaña',
  lead_analytics: 'Analítica de leads',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  generating: 'Generando',
  completed: 'Completado',
  failed: 'Error',
};

export function reportStatusVariant(
  status: ReportStatus,
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  if (status === 'completed') return 'success';
  if (status === 'generating') return 'info';
  if (status === 'failed') return 'error';
  return 'neutral';
}
