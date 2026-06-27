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

export interface SavedSuperadminSession {
  tokens: AuthTokens;
  user: AuthUser;
}

export interface ImpersonationContext {
  tenantName: string;
  userName: string;
}

const STORAGE_KEY = 'mkt-agency-auth';

interface PersistedState {
  tokens: AuthTokens | null;
  user: AuthUser | null;
  impersonation: ImpersonationContext | null;
  savedSuperadminSession: SavedSuperadminSession | null;
}

function loadPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as PersistedState;
    }
  } catch { /* ignore */ }
  return { tokens: null, user: null, impersonation: null, savedSuperadminSession: null };
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
  impersonation: ImpersonationContext | null;
  savedSuperadminSession: SavedSuperadminSession | null;
  setSession: (tokens: AuthTokens, user: AuthUser) => void;
  clearSession: () => void;
  setTokens: (tokens: AuthTokens) => void;
  startImpersonation: (payload: {
    impersonationToken: string;
    tenantName: string;
    impersonatedUser: AuthUser;
    savedSuperadminSession: SavedSuperadminSession;
  }) => void;
  endImpersonation: (sessionToken: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  tokens: initial.tokens,
  user: initial.user,
  impersonation: initial.impersonation,
  savedSuperadminSession: initial.savedSuperadminSession,
  setSession: (tokens, user) => {
    memoryTokens = tokens;
    const state = { tokens, user, impersonation: null, savedSuperadminSession: null };
    set(state);
    persistState(state);
  },
  clearSession: () => {
    memoryTokens = null;
    set({ tokens: null, user: null, impersonation: null, savedSuperadminSession: null });
    clearPersistedState();
  },
  setTokens: (tokens) => {
    memoryTokens = tokens;
    set({ tokens });
    const current = get();
    persistState({ tokens, user: current.user, impersonation: current.impersonation, savedSuperadminSession: current.savedSuperadminSession });
  },
  startImpersonation: ({
    impersonationToken,
    tenantName,
    impersonatedUser,
    savedSuperadminSession,
  }) => {
    const refreshToken = get().tokens?.refreshToken ?? savedSuperadminSession.tokens.refreshToken;
    memoryTokens = {
      accessToken: impersonationToken,
      refreshToken,
    };
    const state = {
      tokens: memoryTokens,
      user: impersonatedUser,
      impersonation: { tenantName, userName: impersonatedUser.name } as ImpersonationContext,
      savedSuperadminSession,
    };
    set(state);
    persistState(state);
  },
  endImpersonation: (sessionToken) => {
    const saved = get().savedSuperadminSession;
    if (!saved) {
      return;
    }

    memoryTokens = {
      accessToken: sessionToken,
      refreshToken: saved.tokens.refreshToken,
    };

    const state = {
      tokens: memoryTokens,
      user: saved.user,
      impersonation: null,
      savedSuperadminSession: null,
    };
    set(state);
    persistState(state);
  },
}));