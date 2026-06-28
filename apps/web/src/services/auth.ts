import { useAuthStore, type AuthTokens, type AuthUser } from '@/store/auth';
import { API_BASE, ApiError, apiFetch } from '@/services/api';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    const message = (body as { error?: string }).error?.trim() || response.statusText || 'Error desconocido';
    throw new ApiError(message, response.status);
  }

  const data = (await response.json()) as LoginResponse;

  useAuthStore.getState().setSession(
    { accessToken: data.accessToken, refreshToken: data.refreshToken },
    data.user,
  );

  return data;
}

export async function logout() {
  const refreshToken = useAuthStore.getState().tokens?.refreshToken;
  if (refreshToken) {
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
  useAuthStore.getState().clearSession();
}

export async function getSetupStatus() {
  return apiFetch<{ isConfigured: boolean }>('/setup/status');
}

export async function initSetup(payload: {
  email: string;
  password: string;
  name: string;
}) {
  return apiFetch('/setup/init', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type { AuthTokens, AuthUser };
