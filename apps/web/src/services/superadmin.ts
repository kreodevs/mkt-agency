import { apiFetch, apiFetchAsPlatform } from '@/services/api';
import type { LlmModelsListResponse } from '@/lib/llm-models';
import {
  applyImpersonationSession,
  exitImpersonation,
  isImpersonating,
  isImpersonatingSession,
} from '@/lib/impersonation';
import type { LlmUsageDashboardResponse } from '@/types/llm-usage';
import type { ImpersonateResponse } from '@/types/impersonation';

export interface SuperadminUser {
  id: string;
  email: string;
  name: string;
  isSuperadmin: boolean;
  role: string;
  status: string;
  tenantId: string | null;
  tenant?: { id: string; name: string; slug: string; plan: string; status: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListUsersResponse {
  items: SuperadminUser[];
  total: number;
  page: number;
  limit: number;
}

export async function listSuperadminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ListUsersResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.search) search.set('search', params.search);
  const qs = search.toString();
  return apiFetch<ListUsersResponse>(`/superadmin/users${qs ? `?${qs}` : ''}`);
}

export async function updateSuperadminUser(
  userId: string,
  payload: { name?: string; role?: string; status?: string },
): Promise<SuperadminUser> {
  return apiFetch<SuperadminUser>(`/superadmin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export interface LlmTaskConfig {
  taskType: string;
  label: string;
  providerId: string | null;
  providerName: string | null;
  providerSlug: string | null;
  model: string;
  fallbackModel?: string | null;
  temperature: number;
  maxTokens?: number;
  systemPromptTemplate?: string | null;
  enabled: boolean;
}

export interface LlmProvider {
  id: string;
  slug: string;
  name: string;
  apiUrl: string;
  defaultModel: string | null;
  apiKeyConfigured: boolean;
  apiKeyHint: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export async function listLlmProviders(includeInactive = false): Promise<LlmProvider[]> {
  const query = includeInactive ? '?includeInactive=true' : '';
  return apiFetch<LlmProvider[]>(`/superadmin/llm-providers${query}`);
}

export async function createLlmProvider(payload: {
  slug: string;
  name: string;
  apiUrl: string;
  apiKey?: string;
  defaultModel?: string;
}): Promise<LlmProvider> {
  return apiFetch<LlmProvider>('/superadmin/llm-providers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateLlmProvider(
  id: string,
  payload: Partial<{
    name: string;
    apiUrl: string;
    apiKey: string | null;
    defaultModel: string | null;
    isActive: boolean;
  }>,
): Promise<LlmProvider> {
  return apiFetch<LlmProvider>(`/superadmin/llm-providers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteLlmProvider(id: string): Promise<void> {
  await apiFetch<void>(`/superadmin/llm-providers/${id}`, { method: 'DELETE' });
}

export async function listLlmProviderModels(providerId: string): Promise<LlmModelsListResponse> {
  return apiFetch<LlmModelsListResponse>(`/superadmin/llm-providers/${providerId}/models`);
}

export async function listLlmTasks(): Promise<LlmTaskConfig[]> {
  return apiFetch<LlmTaskConfig[]>('/superadmin/llm-tasks');
}

export async function updateLlmTask(
  taskType: string,
  payload: Partial<Omit<LlmTaskConfig, 'taskType'>>,
): Promise<LlmTaskConfig> {
  return apiFetch<LlmTaskConfig>(`/superadmin/llm-tasks/${taskType}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getLlmUsageDashboard(
  from?: string,
  to?: string,
): Promise<LlmUsageDashboardResponse> {
  const search = new URLSearchParams();
  if (from) search.set('from', from);
  if (to) search.set('to', to);
  const qs = search.toString();
  return apiFetch<LlmUsageDashboardResponse>(`/superadmin/llm-usage${qs ? `?${qs}` : ''}`);
}

export interface PlatformIntegration {
  slug: string;
  name: string;
  apiKeyConfigured: boolean;
  apiKeyHint: string | null;
  isActive: boolean;
  settings: Record<string, unknown>;
  updatedAt: string;
}

export async function getTavilyIntegration(): Promise<PlatformIntegration> {
  return apiFetch<PlatformIntegration>('/superadmin/integrations/tavily');
}

export async function updateTavilyIntegration(payload: {
  apiKey?: string;
  isActive?: boolean;
}): Promise<PlatformIntegration> {
  return apiFetch<PlatformIntegration>('/superadmin/integrations/tavily', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function testTavilyIntegration(): Promise<{
  ok: true;
  resultCount: number;
  query: string;
}> {
  return apiFetch<{ ok: true; resultCount: number; query: string }>(
    '/superadmin/integrations/tavily/test',
    { method: 'POST' },
  );
}

export async function impersonateTenant(tenantId: string): Promise<ImpersonateResponse> {
  const fetcher = isImpersonatingSession() ? apiFetchAsPlatform : apiFetch;

  const data = await fetcher<ImpersonateResponse>('/superadmin/impersonate', {
    method: 'POST',
    body: JSON.stringify({ tenantId }),
  });

  applyImpersonationSession(data, tenantId);
  return data;
}

export { exitImpersonation, isImpersonating };
