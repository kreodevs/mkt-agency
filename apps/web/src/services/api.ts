import { getAccessToken, getRefreshToken, useAuthStore } from '@/store/auth';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function parseErrorBody(body: Record<string, unknown>, statusText: string): string {
  if (typeof body.error === 'string' && body.error.trim()) {
    return body.error.trim();
  }
  if (typeof body.details === 'string' && body.details.trim()) {
    return body.details.trim();
  }
  if (typeof body.message === 'string' && body.message.trim()) {
    return body.message.trim();
  }
  if (Array.isArray(body.message) && body.message.length > 0) {
    return body.message.map((item) => String(item)).join('. ');
  }
  return statusText.trim() || 'Error desconocido';
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado',
): string {
  if (error instanceof ApiError) {
    const message = error.message.trim();
    if (message) {
      return message;
    }
    if (error.code) {
      return error.code;
    }
    return fallback;
  }

  if (error instanceof Error) {
    const message = error.message.trim();
    if (message) {
      return message;
    }
  }

  return fallback;
}

async function refreshAccessToken(): Promise<string | null> {
  const store = useAuthStore.getState();
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  // If impersonating and we get a 401, the impersonation token expired.
  // Restore the superadmin session instead of refreshing (refresh would give
  // a non-impersonated token, causing data mismatch and flicker).
  if (store.impersonation && store.savedSuperadminSession) {
    const saved = store.savedSuperadminSession;
    store.endImpersonation(saved.tokens.accessToken);
    // The state is now restored to the superadmin. Return null so the caller
    // gets a 401 and the UI re-renders as the superadmin.
    return null;
  }

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    store.clearSession();
    return null;
  }

  const data = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  store.setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return data.accessToken;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (response.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, init, false);
    }
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown> & {
      code?: string;
    };
    throw new ApiError(
      parseErrorBody(body, response.statusText),
      response.status,
      typeof body.code === 'string' ? body.code : undefined,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
