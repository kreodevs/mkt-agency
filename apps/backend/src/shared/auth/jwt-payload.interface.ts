export interface JwtPayload {
  sub: string;
  email: string;
  isSuperadmin: boolean;
  role: string;
  tenantId?: string | null;
  impersonating?: boolean;
  superadminId?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  isSuperadmin: boolean;
  role: string;
  tenantId: string | null;
  impersonating: boolean;
  superadminId: string | null;
}
