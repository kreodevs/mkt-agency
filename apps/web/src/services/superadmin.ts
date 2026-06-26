import { apiFetch } from '@/services/api';
import {
  useAuthStore,
  type AuthTokens,
  type AuthUser,
} from '@/store/auth';

export interface ImpersonateResponse {
  impersonationToken: string;
  expiresIn: number;
  tenant: { id: string; name: string };
  user: { id: string; name: string; email: string };
  note: string;
}

export interface EndImpersonationResponse {
  message: string;
  sessionToken: string;
}

export async function startImpersonation(payload: {
  tenantId: string;
  userId: string;
}): Promise<ImpersonateResponse> {
  const state = useAuthStore.getState();
  const savedSuperadminSession = {
    tokens: state.tokens as AuthTokens,
    user: state.user as AuthUser,
  };

  const data = await apiFetch<ImpersonateResponse>('/superadmin/impersonate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  useAuthStore.getState().startImpersonation({
    impersonationToken: data.impersonationToken,
    tenantName: data.tenant.name,
    impersonatedUser: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: 'owner',
      isSuperadmin: false,
      tenantId: payload.tenantId,
      impersonating: true,
    },
    savedSuperadminSession,
  });

  return data;
}

export async function endImpersonation(): Promise<EndImpersonationResponse> {
  const data = await apiFetch<EndImpersonationResponse>('/superadmin/impersonate', {
    method: 'DELETE',
  });

  useAuthStore.getState().endImpersonation(data.sessionToken);

  return data;
}
