import { apiFetch, apiFetchAsPlatform } from '@/services/api';
import { isImpersonatingSession } from '@/lib/impersonation';
import type {
  ListTenantsParams,
  PaginatedTenantsResponse,
  Tenant,
  UpdateTenantPayload,
} from '@/types/tenant';

export interface CreateTenantPayload {
  name: string;
  slug: string;
  packageId: string;
  owner: {
    email: string;
    password: string;
    name: string;
  };
}

export interface CreateTenantResponse extends Tenant {
  owner?: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
  };
}

function buildQuery(params: ListTenantsParams): string {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.status) search.set('status', params.status);
  if (params.plan) search.set('plan', params.plan);
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function listTenants(
  params: ListTenantsParams = {},
): Promise<PaginatedTenantsResponse> {
  const path = `/tenants${buildQuery(params)}`;
  if (isImpersonatingSession()) {
    return apiFetchAsPlatform<PaginatedTenantsResponse>(path);
  }
  return apiFetch<PaginatedTenantsResponse>(path);
}

export async function getTenant(id: string): Promise<Tenant> {
  return apiFetch<Tenant>(`/tenants/${id}`);
}

export async function createTenant(payload: CreateTenantPayload): Promise<CreateTenantResponse> {
  return apiFetch<CreateTenantResponse>('/tenants', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTenant(id: string, payload: UpdateTenantPayload): Promise<Tenant> {
  return apiFetch<Tenant>(`/tenants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
