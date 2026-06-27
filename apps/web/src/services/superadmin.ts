import { apiFetch } from '@/services/api';
import {
  useAuthStore,
  type AuthTokens,
  type AuthUser,
} from '@/store/auth';

export interface ImpersonateResponse {
  impersonationToken: string;
  expiresIn: number;
  tenant: { id: string; name: string };
  user: { id: string; name: string; email: string };
  note: string;
}

export interface EndImpersonationResponse {
  message: string;
  sessionToken: string;
}

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

export async function listSuperadminUsers(params?: { page?: number; limit?: number; search?: string }): Promise<ListUsersResponse> {
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
  provider: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  systemPromptTemplate?: string | null;
  enabled: boolean;
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

export async function startImpersonation(payload: {
  tenantId: string;
  userId: string;
}): Promise<ImpersonateResponse> {
  const state = useAuthStore.getState();
  const savedSuperadminSession = {
    tokens: state.tokens as AuthTokens,
    user: state.user as AuthUser,
  };

  const data = await apiFetch<ImpersonateResponse>('/superadmin/impersonate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  useAuthStore.getState().startImpersonation({
    impersonationToken: data.impersonationToken,
    tenantName: data.tenant.name,
    impersonatedUser: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: 'owner',
      isSuperadmin: false,
      tenantId: payload.tenantId,
      impersonating: true,
    },
    savedSuperadminSession,
  });

  return data;
}

export async function endImpersonation(): Promise<EndImpersonationResponse> {
  const data = await apiFetch<EndImpersonationResponse>('/superadmin/impersonate', {
    method: 'DELETE',
  });

  useAuthStore.getState().endImpersonation(data.sessionToken);

  return data;
}
