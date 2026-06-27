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
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    useAuthStore.getState().clearSession();
    return null;
  }

  const data = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  useAuthStore.getState().setTokens({
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
