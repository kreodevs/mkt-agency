import { apiFetch } from '@/services/api';
import type {
  CreateReportPayload,
  CreateReportResponse,
  PaginatedReportsResponse,
  Report,
  ReportType,
} from '@/types/reports';

export interface ListReportsParams {
  type?: ReportType;
  campaignId?: string;
  page?: number;
  limit?: number;
}

function buildQuery(params: ListReportsParams): string {
  const search = new URLSearchParams();
  if (params.type) search.set('type', params.type);
  if (params.campaignId) search.set('campaignId', params.campaignId);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listReports(
  params: ListReportsParams = {},
): Promise<PaginatedReportsResponse> {
  return apiFetch<PaginatedReportsResponse>(`/reports${buildQuery(params)}`);
}

export async function getReport(id: string): Promise<Report> {
  return apiFetch<Report>(`/reports/${id}`);
}

export async function createReport(payload: CreateReportPayload): Promise<CreateReportResponse> {
  return apiFetch<CreateReportResponse>('/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
