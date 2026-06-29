export type TenantPlan = 'starter' | 'professional' | 'enterprise';
export type TenantStatus = 'active' | 'suspended' | 'deleted';

export interface TenantPlatformAdmin {
  id: string;
  email: string;
  name: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  packageId: string | null;
  status: TenantStatus;
  settings: Record<string, unknown>;
  maxUsers: number;
  maxAssetsSize: number;
  maxFileSize: number;
  createdAt: string;
  updatedAt: string;
  platformAdmins?: TenantPlatformAdmin[];
}

export interface UpdateTenantPayload {
  name?: string;
  plan?: TenantPlan;
  status?: TenantStatus;
  packageId?: string;
  maxUsers?: number;
  maxAssetsSize?: number;
  maxFileSize?: number;
  platformAdminIds?: string[];
}

export interface ListTenantsParams {
  page?: number;
  limit?: number;
  status?: TenantStatus;
  plan?: TenantPlan;
}

export interface PaginatedTenantsResponse {
  items: Tenant[];
  total: number;
  page: number;
  limit: number;
}
