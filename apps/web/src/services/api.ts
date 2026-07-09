import { getAccessToken, getRefreshToken, useAuthStore } from '@/store/auth';
import {
  getPlatformAccessToken,
  getPlatformRefreshToken,
  readImpersonationContext,
  restoreSuperadminOnExpiredImpersonation,
  updatePlatformTokens,
} from '@/lib/impersonation';

export const API_BASE = '/api/v1';

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

  if (store.user?.impersonating) {
    restoreSuperadminOnExpiredImpersonation();
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

export interface ApiFetchOptions {
  retry?: boolean;
  accessToken?: string;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {},
): Promise<T> {
  const retry = options.retry ?? true;
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = options.accessToken ?? getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (response.status === 401 && retry) {
    if (options.accessToken) {
      throw new ApiError('Sesión de plataforma inválida', 401, 'UNAUTHORIZED');
    }

    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, init, { ...options, retry: false });
    }
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown> & {
      code?: string;
    };

    const statusMessage =
      response.status === 504
        ? 'La operación tardó demasiado. Si activaste agentes, revisa la bandeja en unos minutos.'
        : response.status === 502
          ? 'El servidor no respondió a tiempo. Intenta de nuevo en unos segundos.'
          : response.statusText;

    throw new ApiError(
      parseErrorBody(body, statusMessage),
      response.status,
      typeof body.code === 'string' ? body.code : undefined,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function refreshPlatformAccessToken(): Promise<string | null> {
  const refreshToken =
    getPlatformRefreshToken() ?? useAuthStore.getState().tokens?.refreshToken ?? null;
  if (!refreshToken || !readImpersonationContext()) {
    return null;
  }

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  updatePlatformTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return data.accessToken;
}

export async function apiFetchAsPlatform<T>(
  path: string,
  init: RequestInit = {},
  options: { retry?: boolean } = {},
): Promise<T> {
  const retry = options.retry ?? true;
  const platformToken = getPlatformAccessToken();
  if (!platformToken) {
    throw new ApiError('Sesión de plataforma no disponible', 401, 'UNAUTHORIZED');
  }

  try {
    return await apiFetch<T>(path, init, { accessToken: platformToken, retry: false });
  } catch (error) {
    if (retry && error instanceof ApiError && error.status === 401) {
      const refreshed = await refreshPlatformAccessToken();
      if (refreshed) {
        return apiFetch<T>(path, init, { accessToken: refreshed, retry: false });
      }
    }
    throw error;
  }
}
