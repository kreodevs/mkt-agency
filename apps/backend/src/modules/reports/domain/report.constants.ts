export type ReportType = 'campaign_performance' | 'lead_analytics';

export type ReportStatus = 'generating' | 'completed' | 'failed';

export const REPORT_TYPES: ReportType[] = ['campaign_performance', 'lead_analytics'];

export const REPORT_STATUSES: ReportStatus[] = ['generating', 'completed', 'failed'];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  campaign_performance: 'Rendimiento de campaña',
  lead_analytics: 'Analítica de leads',
};
