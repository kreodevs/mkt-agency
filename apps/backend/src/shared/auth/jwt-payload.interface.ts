export type JwtTokenScope = 'asset:read';

export interface JwtPayload {
  sub: string;
  email: string;
  isSuperadmin: boolean;
  role: string;
  tenantId?: string | null;
  impersonating?: boolean;
  superadminId?: string;
  scope?: JwtTokenScope;
  assetId?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  isSuperadmin: boolean;
  role: string;
  tenantId: string | null;
  impersonating: boolean;
  superadminId: string | null;
  tokenScope: JwtTokenScope | null;
  assetId: string | null;
}
