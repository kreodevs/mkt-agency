export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  packageId: string | null;
  status: string;
  settings: Record<string, unknown>;
  maxUsers: number;
  maxAssetsSize: number;
  maxFileSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantData {
  name: string;
  slug: string;
  plan: string;
  packageId?: string | null;
  maxUsers?: number;
  maxAssetsSize?: number;
  maxFileSize?: number;
}

export interface UpdateTenantData {
  plan?: string;
  packageId?: string | null;
  status?: string;
  settings?: Record<string, unknown>;
  maxUsers?: number;
  maxAssetsSize?: number;
  maxFileSize?: number;
}

export interface ListTenantsParams {
  page: number;
  limit: number;
  status?: string;
  plan?: string;
}

export interface ListTenantsResult {
  items: Tenant[];
  total: number;
  page: number;
  limit: number;
}

export interface TenantRepositoryPort {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  list(params: ListTenantsParams): Promise<ListTenantsResult>;
  create(data: CreateTenantData): Promise<Tenant>;
  update(id: string, data: UpdateTenantData): Promise<Tenant | null>;
  delete(id: string): Promise<boolean>;
}

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');
