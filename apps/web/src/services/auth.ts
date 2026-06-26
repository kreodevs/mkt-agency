import { apiFetch } from '@/services/api';
import { useAuthStore, type AuthTokens, type AuthUser } from '@/store/auth';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function login(email: string, password: string) {
  const data = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

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
