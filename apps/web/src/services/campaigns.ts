import { apiFetch } from '@/services/api';
import type {
  AutoGenerateCampaignPayload,
  AutoGenerateCampaignResponse,
  Budget,
  Campaign,
  CampaignAgentReadiness,
  CampaignExecutionMode,
  CreateCampaignPayload,
  GenerateStrategyAccepted,
  ListCampaignsParams,
  PaginatedCampaignsResponse,
  PaginatedCampaignTemplatesResponse,
  StrategyAssignment,
  UpdateCampaignPayload,
} from '@/types/campaign';

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function listCampaigns(
  params: ListCampaignsParams = {},
): Promise<PaginatedCampaignsResponse> {
  return apiFetch<PaginatedCampaignsResponse>(
    `/campaigns${buildQuery(params as Record<string, string | number | undefined>)}`,
  );
}

export async function getCampaign(id: string): Promise<Campaign> {
  return apiFetch<Campaign>(`/campaigns/${id}`);
}

export async function createCampaign(payload: CreateCampaignPayload): Promise<Campaign> {
  return apiFetch<Campaign>('/campaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCampaign(
  id: string,
  payload: UpdateCampaignPayload,
): Promise<Campaign> {
  return apiFetch<Campaign>(`/campaigns/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteCampaign(id: string): Promise<void> {
  return apiFetch<void>(`/campaigns/${id}`, { method: 'DELETE' });
}

export async function generateCampaignStrategy(
  campaignId: string,
): Promise<GenerateStrategyAccepted> {
  return apiFetch<GenerateStrategyAccepted>(`/campaigns/${campaignId}/generate-strategy`, {
    method: 'POST',
  });
}

export async function getStrategyAssignment(
  assignmentId: string,
): Promise<StrategyAssignment> {
  return apiFetch<StrategyAssignment>(`/campaigns/strategy-assignments/${assignmentId}`);
}

export async function listCampaignBudgets(campaignId: string): Promise<Budget[]> {
  return apiFetch<Budget[]>(`/campaigns/${campaignId}/budgets`);
}

export async function updateCampaignBudget(
  campaignId: string,
  budgetId: string,
  approved: boolean,
): Promise<Budget> {
  return apiFetch<Budget>(`/campaigns/${campaignId}/budgets/${budgetId}`, {
    method: 'PATCH',
    body: JSON.stringify({ approved }),
  });
}

export async function listCampaignTemplates(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedCampaignTemplatesResponse> {
  return apiFetch<PaginatedCampaignTemplatesResponse>(
    `/campaign-templates${buildQuery(params ?? {})}`,
  );
}

export async function getCampaignAgentReadiness(
  mode: CampaignExecutionMode = 'organic',
): Promise<CampaignAgentReadiness> {
  return apiFetch<CampaignAgentReadiness>(
    `/campaigns/agent-readiness${buildQuery({ mode })}`,
  );
}

export async function autoGenerateCampaign(
  payload: AutoGenerateCampaignPayload = {},
): Promise<AutoGenerateCampaignResponse> {
  return apiFetch<AutoGenerateCampaignResponse>('/campaigns/auto-generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
