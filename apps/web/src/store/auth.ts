import { create } from 'zustand';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isSuperadmin: boolean;
  tenantId: string | null;
  impersonating?: boolean;
}

const STORAGE_KEY = 'mkt-agency-auth';

interface PersistedState {
  tokens: AuthTokens | null;
  user: AuthUser | null;
  impersonationTenantName: string | null;
}

function loadPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState & {
        impersonation?: unknown;
        savedSuperadminSession?: unknown;
      };
      return {
        tokens: parsed.tokens ?? null,
        user: parsed.user ?? null,
        impersonationTenantName: parsed.impersonationTenantName ?? null,
      };
    }
  } catch { /* ignore */ }
  return { tokens: null, user: null, impersonationTenantName: null };
}

function persistState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

const initial = loadPersistedState();

let memoryTokens: AuthTokens | null = initial.tokens;

export const getAccessToken = () => memoryTokens?.accessToken ?? null;
export const getRefreshToken = () => memoryTokens?.refreshToken ?? null;

interface AuthState {
  tokens: AuthTokens | null;
  user: AuthUser | null;
  impersonationTenantName: string | null;
  setSession: (tokens: AuthTokens, user: AuthUser) => void;
  clearSession: () => void;
  setTokens: (tokens: AuthTokens) => void;
  setImpersonationSession: (tokens: AuthTokens, user: AuthUser, tenantName: string) => void;
  restorePlatformSession: (tokens: AuthTokens, user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  tokens: initial.tokens,
  user: initial.user,
  impersonationTenantName: initial.impersonationTenantName,
  setSession: (tokens, user) => {
    memoryTokens = tokens;
    const state = { tokens, user, impersonationTenantName: null };
    set(state);
    persistState(state);
  },
  clearSession: () => {
    memoryTokens = null;
    set({ tokens: null, user: null, impersonationTenantName: null });
    clearPersistedState();
  },
  setTokens: (tokens) => {
    memoryTokens = tokens;
    set({ tokens });
    const current = get();
    persistState({
      tokens,
      user: current.user,
      impersonationTenantName: current.impersonationTenantName,
    });
  },
  setImpersonationSession: (tokens, user, tenantName) => {
    memoryTokens = tokens;
    const state = { tokens, user, impersonationTenantName: tenantName };
    set(state);
    persistState(state);
  },
  restorePlatformSession: (tokens, user) => {
    memoryTokens = tokens;
    const state = { tokens, user, impersonationTenantName: null };
    set(state);
    persistState(state);
  },
}));
