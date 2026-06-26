import { apiFetch } from '@/services/api';
import type {
  ChangeLeadStagePayload,
  Lead,
  LeadInteractionsListResponse,
  ListLeadsParams,
  PaginatedLeadsResponse,
  UpdateLeadPayload,
} from '@/types/leads';

function buildQuery(params: ListLeadsParams): string {
  const search = new URLSearchParams();
  if (params.stage) search.set('stage', params.stage);
  if (params.minScore !== undefined) search.set('minScore', String(params.minScore));
  if (params.formId) search.set('formId', params.formId);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listLeads(params: ListLeadsParams = {}): Promise<PaginatedLeadsResponse> {
  return apiFetch<PaginatedLeadsResponse>(`/leads${buildQuery(params)}`);
}

export async function getLead(id: string): Promise<Lead> {
  return apiFetch<Lead>(`/leads/${id}`);
}

export async function updateLead(id: string, payload: UpdateLeadPayload): Promise<Lead> {
  return apiFetch<Lead>(`/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function changeLeadStage(id: string, payload: ChangeLeadStagePayload): Promise<Lead> {
  return apiFetch<Lead>(`/leads/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteLead(id: string): Promise<void> {
  return apiFetch<void>(`/leads/${id}`, { method: 'DELETE' });
}

export async function listLeadInteractions(id: string): Promise<LeadInteractionsListResponse> {
  return apiFetch<LeadInteractionsListResponse>(`/leads/${id}/interactions`);
}
