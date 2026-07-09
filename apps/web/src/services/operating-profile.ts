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

export interface AttributionReport {
  model: 'first_touch' | 'last_touch';
  periodDays: number;
  totalLeads: number;
  byChannel: Array<{ channel: string; count: number; share: number }>;
}

export async function getAgencyAttribution(params?: {
  model?: 'first_touch' | 'last_touch';
  productId?: string;
}): Promise<AttributionReport> {
  const search = new URLSearchParams();
  if (params?.model) search.set('model', params.model);
  if (params?.productId) search.set('productId', params.productId);
  const q = search.toString();
  return apiFetch<AttributionReport>(`/agency/attribution${q ? `?${q}` : ''}`);
}

export async function getTenantWebhookInfo(): Promise<{
  webhookUrl: string;
  secret: string;
  header: string;
  exampleBody: Record<string, unknown>;
}> {
  return apiFetch('/tenant/webhook-info');
}
