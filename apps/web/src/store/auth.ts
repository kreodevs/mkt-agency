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

let memoryTokens: AuthTokens | null = null;

export const getAccessToken = () => memoryTokens?.accessToken ?? null;
export const getRefreshToken = () => memoryTokens?.refreshToken ?? null;

export const useAuthStore = create<AuthState>((set, get) => ({
  tokens: null,
  user: null,
  impersonation: null,
  savedSuperadminSession: null,
  setSession: (tokens, user) => {
    memoryTokens = tokens;
    set({
      tokens,
      user,
      impersonation: null,
      savedSuperadminSession: null,
    });
  },
  clearSession: () => {
    memoryTokens = null;
    set({
      tokens: null,
      user: null,
      impersonation: null,
      savedSuperadminSession: null,
    });
  },
  setTokens: (tokens) => {
    memoryTokens = tokens;
    set({ tokens });
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
    set({
      tokens: memoryTokens,
      user: impersonatedUser,
      impersonation: { tenantName, userName: impersonatedUser.name },
      savedSuperadminSession,
    });
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

    set({
      tokens: memoryTokens,
      user: saved.user,
      impersonation: null,
      savedSuperadminSession: null,
    });
  },
}));
