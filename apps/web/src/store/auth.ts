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
}

interface AuthState {
  tokens: AuthTokens | null;
  user: AuthUser | null;
  setSession: (tokens: AuthTokens, user: AuthUser) => void;
  clearSession: () => void;
  setTokens: (tokens: AuthTokens) => void;
}

let memoryTokens: AuthTokens | null = null;

export const getAccessToken = () => memoryTokens?.accessToken ?? null;
export const getRefreshToken = () => memoryTokens?.refreshToken ?? null;

export const useAuthStore = create<AuthState>((set) => ({
  tokens: null,
  user: null,
  setSession: (tokens, user) => {
    memoryTokens = tokens;
    set({ tokens, user });
  },
  clearSession: () => {
    memoryTokens = null;
    set({ tokens: null, user: null });
  },
  setTokens: (tokens) => {
    memoryTokens = tokens;
    set({ tokens });
  },
}));
