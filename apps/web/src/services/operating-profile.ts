import { apiFetch, apiUpload } from '@/services/api';
import type {
  AgencyPlan,
  AgentEventItem,
  CampaignTemplateSuggestion,
  CreateAgencyPlanPayload,
  ExecutiveWeeklyReport,
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

export async function getExecutiveReport(productId?: string): Promise<ExecutiveWeeklyReport | null> {
  const q = productId ? `?productId=${productId}` : '';
  return apiFetch<ExecutiveWeeklyReport | null>(`/agency/executive-report${q}`);
}

export async function generateExecutiveReport(
  productId?: string,
): Promise<ExecutiveWeeklyReport> {
  const q = productId ? `?productId=${productId}` : '';
  return apiFetch<ExecutiveWeeklyReport>(`/agency/executive-report/generate${q}`, {
    method: 'POST',
  });
}

export async function getCampaignTemplateSuggestions(
  productId?: string,
  limit = 3,
): Promise<CampaignTemplateSuggestion[]> {
  const search = new URLSearchParams();
  if (productId) search.set('productId', productId);
  search.set('limit', String(limit));
  return apiFetch<CampaignTemplateSuggestion[]>(
    `/agency/campaign-template-suggestions?${search.toString()}`,
  );
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

export interface PaidPerformanceCrossSummary {
  periodDays: number;
  ads: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    importCount: number;
  };
  leads: {
    attributedPaidLeads: number;
    totalLeads: number;
  };
  metrics: {
    costPerLead: number | null;
    costPerClick: number | null;
  };
}

export interface AdPerformanceImportItem {
  id: string;
  platform: string;
  sourceFormat: string;
  fileName: string;
  periodStart: string | null;
  periodEnd: string | null;
  rowCount: number;
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  };
  createdAt: string;
}

export async function getPaidPerformanceCross(productId?: string): Promise<PaidPerformanceCrossSummary> {
  const q = productId ? `?productId=${productId}` : '';
  return apiFetch<PaidPerformanceCrossSummary>(`/agency/performance/paid${q}`);
}

export async function listAdPerformanceImports(limit = 10): Promise<AdPerformanceImportItem[]> {
  return apiFetch<AdPerformanceImportItem[]>(`/agency/performance/imports?limit=${limit}`);
}

export async function importAdPerformanceCsv(
  file: File,
  options?: { productId?: string; platform?: 'meta' | 'google' | 'auto' },
): Promise<AdPerformanceImportItem> {
  const formData = new FormData();
  formData.append('file', file);
  if (options?.productId) formData.append('productId', options.productId);
  if (options?.platform) formData.append('platform', options.platform);
  return apiUpload<AdPerformanceImportItem>('/agency/performance/import', formData);
}

export async function getTenantWebhookInfo(): Promise<{
  webhookUrl: string;
  hasSecret: boolean;
  header: string;
  exampleBody: Record<string, unknown>;
}> {
  return apiFetch('/tenant/webhook-info');
}

export async function rotateTenantWebhookSecret(): Promise<{
  webhookUrl: string;
  secret: string;
  header: string;
}> {
  return apiFetch('/tenant/webhook-info/rotate', { method: 'POST' });
}
