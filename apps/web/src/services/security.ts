import { apiFetch } from '@/services/api';
import type {
  ListSecurityEventsParams,
  PaginatedSecurityEventsResponse,
} from '@/types/security';

function buildQuery(params: ListSecurityEventsParams): string {
  const search = new URLSearchParams();
  if (params.severity) search.set('severity', params.severity);
  if (params.eventType) search.set('eventType', params.eventType);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listSecurityEvents(
  params: ListSecurityEventsParams = {},
): Promise<PaginatedSecurityEventsResponse> {
  return apiFetch<PaginatedSecurityEventsResponse>(`/security-events${buildQuery(params)}`);
}
