import { Tenant } from '../domain/tenant.repository.port';
import { CreateTenantResult } from '../commands/create-tenant.command';

export class TenantOwnerResponseDto {
  id!: string;
  email!: string;
  name!: string;
  role!: string;
  tenantId!: string;
}

export class TenantResponseDto {
  id!: string;
  name!: string;
  slug!: string;
  plan!: string;
  status!: string;
  settings!: Record<string, unknown>;
  maxUsers!: number;
  maxAssetsSize!: number;
  createdAt!: Date;
  updatedAt!: Date;
  owner?: TenantOwnerResponseDto;
}

export class PaginatedTenantsResponseDto {
  items!: TenantResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}

export function toTenantResponse(tenant: Tenant): TenantResponseDto {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    plan: tenant.plan,
    status: tenant.status,
    settings: tenant.settings,
    maxUsers: tenant.maxUsers,
    maxAssetsSize: tenant.maxAssetsSize,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
  };
}

export function toCreateTenantResponse(
  result: CreateTenantResult,
): TenantResponseDto {
  return {
    ...toTenantResponse(result),
    owner: result.owner,
  };
}
