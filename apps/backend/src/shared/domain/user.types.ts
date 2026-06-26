export interface CreatedSuperadmin {
  id: string;
  email: string;
  name: string;
  isSuperadmin: true;
}

export interface CreateSuperadminParams {
  email: string;
  name: string;
  passwordHash: string;
}

export interface CreatedTenantOwner {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

export interface CreateTenantOwnerParams {
  tenantId: string;
  email: string;
  name: string;
  passwordHash: string;
}

export interface AuthUserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  isSuperadmin: boolean;
  role: string;
  tenantId: string | null;
  status: string;
  loginAttempts: number;
  lockedUntil: Date | null;
  tenantStatus: string | null;
}

export interface PublicUserRecord {
  id: string;
  email: string;
  name: string;
  isSuperadmin: boolean;
  role: string;
  tenantId: string | null;
}
