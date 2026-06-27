import { PackageEntity } from '../infrastructure/typeorm/package.entity';

export class PackageResponseDto {
  id!: string;
  slug!: string;
  name!: string;
  description!: string | null;
  maxUsers!: number;
  maxAssetsSize!: number;
  maxFileSize!: number;
  maxCampaigns!: number | null;
  maxAiRequestsPerDay!: number | null;
  features!: Record<string, unknown>;
  isActive!: boolean;
  sortOrder!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export function toPackageResponse(entity: PackageEntity): PackageResponseDto {
  return {
    id: entity.id,
    slug: entity.slug,
    name: entity.name,
    description: entity.description,
    maxUsers: entity.maxUsers,
    maxAssetsSize: Number(entity.maxAssetsSize),
    maxFileSize: Number(entity.maxFileSize),
    maxCampaigns: entity.maxCampaigns,
    maxAiRequestsPerDay: entity.maxAiRequestsPerDay,
    features: entity.features,
    isActive: entity.isActive,
    sortOrder: entity.sortOrder,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

export class PackageListResponseDto {
  items!: PackageResponseDto[];
}
