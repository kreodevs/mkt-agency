import { apiFetch } from '@/services/api';

export interface Package {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  maxUsers: number;
  maxAssetsSize: number;
  maxFileSize: number;
  maxCampaigns: number | null;
  maxAiRequestsPerDay: number | null;
  features: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PackageListResponse {
  items: Package[];
}

export interface UpsertPackagePayload {
  slug?: string;
  name?: string;
  description?: string | null;
  maxUsers?: number;
  maxAssetsSize?: number;
  maxFileSize?: number;
  maxCampaigns?: number | null;
  maxAiRequestsPerDay?: number | null;
  features?: Record<string, unknown>;
  isActive?: boolean;
  sortOrder?: number;
}

export async function listPackages(includeInactive = false): Promise<PackageListResponse> {
  const query = includeInactive ? '?includeInactive=true' : '';
  return apiFetch<PackageListResponse>(`/packages${query}`);
}

export async function createPackage(payload: Required<Pick<UpsertPackagePayload, 'slug' | 'name' | 'maxUsers' | 'maxAssetsSize' | 'maxFileSize'>> &
  UpsertPackagePayload): Promise<Package> {
  return apiFetch<Package>('/packages', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePackage(id: string, payload: UpsertPackagePayload): Promise<Package> {
  return apiFetch<Package>(`/packages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePackage(id: string): Promise<void> {
  await apiFetch<void>(`/packages/${id}`, { method: 'DELETE' });
}

export interface TenantLimits {
  tenantId: string;
  packageId: string | null;
  packageName: string | null;
  packageSlug: string | null;
  maxUsers: number;
  maxAssetsSize: number;
  maxFileSize: number;
  maxCampaigns: number | null;
  maxAiRequestsPerDay: number | null;
  features: Record<string, unknown>;
  usage: {
    users: number;
    assetsBytes: number;
    campaigns: number;
  };
}

export async function getTenantLimits(): Promise<TenantLimits> {
  return apiFetch<TenantLimits>('/tenant/limits');
}
