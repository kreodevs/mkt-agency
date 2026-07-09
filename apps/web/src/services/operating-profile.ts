import { apiFetch } from '@/services/api';
import type {
  AgencyPlan,
  AgentEventItem,
  CreateAgencyPlanPayload,
  LeadPerformanceSummary,
  OperatingProfileResponse,
  UpdateOperatingProfilePayload,
} from '@/types/operating-profile';

export async function getOperatingProfile(): Promise<OperatingProfileResponse> {
  return apiFetch<OperatingProfileResponse>('/tenant/operating-profile');
}

export async function updateOperatingProfile(
  payload: UpdateOperatingProfilePayload,
): Promise<OperatingProfileResponse> {
  return apiFetch<OperatingProfileResponse>('/tenant/operating-profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function listAgentEvents(params?: {
  productId?: string;
  limit?: number;
}): Promise<AgentEventItem[]> {
  const search = new URLSearchParams();
  if (params?.productId) search.set('productId', params.productId);
  if (params?.limit) search.set('limit', String(params.limit));
  const q = search.toString();
  return apiFetch<AgentEventItem[]>(`/agency/events${q ? `?${q}` : ''}`);
}

export async function getAgencyPerformance(productId?: string): Promise<LeadPerformanceSummary> {
  const q = productId ? `?productId=${productId}` : '';
  return apiFetch<LeadPerformanceSummary>(`/agency/performance${q}`);
}

export async function listAgencyPlans(): Promise<AgencyPlan[]> {
  return apiFetch<AgencyPlan[]>('/agency/plans');
}

export async function createAgencyPlan(payload: CreateAgencyPlanPayload): Promise<AgencyPlan> {
  return apiFetch<AgencyPlan>('/agency/plans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function approveAgencyPlan(planId: string): Promise<AgencyPlan> {
  return apiFetch<AgencyPlan>(`/agency/plans/${planId}/approve`, { method: 'POST' });
}

export async function getAgencyAnomalies(productId?: string) {
  const q = productId ? `?productId=${productId}` : '';
  return apiFetch<Array<{ type: string; severity: string; recommendation: string }>>(
    `/agency/anomalies${q}`,
  );
}
