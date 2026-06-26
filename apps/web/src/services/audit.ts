import { apiFetch } from '@/services/api';
import type { ListAuditLogsParams, PaginatedAuditLogsResponse } from '@/types/audit';

function buildQuery(params: ListAuditLogsParams): string {
  const search = new URLSearchParams();
  if (params.tenantId) search.set('tenantId', params.tenantId);
  if (params.action) search.set('action', params.action);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listAuditLogs(
  params: ListAuditLogsParams = {},
): Promise<PaginatedAuditLogsResponse> {
  return apiFetch<PaginatedAuditLogsResponse>(`/audit-logs${buildQuery(params)}`);
}
