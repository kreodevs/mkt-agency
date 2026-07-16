import { flushSync } from 'react-dom';
import {
  useAuthStore,
  type AuthTokens,
  type AuthUser,
} from '@/store/auth';
import { useActiveProductStore } from '@/store/active-product';
import type { ImpersonateResponse } from '@/types/impersonation';

const STORAGE_KEY = 'mkt-agency_impersonation';

export type ImpersonationContext = {
  platformTokens: AuthTokens;
  platformUser: AuthUser;
};

export function saveImpersonationContext(ctx: ImpersonationContext): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
}

export function readImpersonationContext(): ImpersonationContext | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ImpersonationContext;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearImpersonationContext(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function isImpersonating(): boolean {
  return readImpersonationContext() !== null;
}

export function getPlatformAccessToken(): string | null {
  return readImpersonationContext()?.platformTokens.accessToken ?? null;
}

export function getPlatformRefreshToken(): string | null {
  return readImpersonationContext()?.platformTokens.refreshToken ?? null;
}

export function updatePlatformTokens(tokens: AuthTokens): void {
  const ctx = readImpersonationContext();
  if (!ctx) return;
  saveImpersonationContext({ ...ctx, platformTokens: tokens });

  const state = useAuthStore.getState();
  if (state.user?.impersonating && state.tokens) {
    useAuthStore.getState().setTokens({
      accessToken: state.tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  }
}

export function isImpersonatingSession(): boolean {
  if (readImpersonationContext() !== null) return true;
  return useAuthStore.getState().user?.impersonating === true;
}

export function applyImpersonationSession(data: ImpersonateResponse, tenantId: string): void {
  const state = useAuthStore.getState();

  if (!readImpersonationContext() && state.user?.isSuperadmin && state.tokens) {
    saveImpersonationContext({
      platformTokens: state.tokens,
      platformUser: state.user,
    });
  }

  const refreshToken =
    state.tokens?.refreshToken ??
    readImpersonationContext()?.platformTokens.refreshToken ??
    '';

  flushSync(() => {
    useActiveProductStore.getState().setActiveProduct(null);
    useAuthStore.getState().setImpersonationSession(
      {
        accessToken: data.impersonationToken,
        refreshToken,
      },
      {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        isSuperadmin: false,
        tenantId,
        impersonating: true,
      },
      data.tenant.name,
    );
  });
}

export function exitImpersonation(): void {
  const ctx = readImpersonationContext();
  clearImpersonationContext();

  if (!ctx) {
    useAuthStore.getState().clearSession();
    window.location.replace('/login');
    return;
  }

  useAuthStore.getState().restorePlatformSession(ctx.platformTokens, ctx.platformUser);
  window.location.replace('/tenants');
}

export function restoreSuperadminOnExpiredImpersonation(): void {
  if (!isImpersonating()) return;
  exitImpersonation();
}
