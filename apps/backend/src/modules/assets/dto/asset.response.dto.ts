import type { AssetType } from '../domain/asset.constants';

export class AssetTagResponseDto {
  id!: string;
  name!: string;
}

export class AssetResponseDto {
  id!: string;
  tenantId!: string;
  folderId!: string | null;
  name!: string;
  type!: AssetType;
  mimeType!: string | null;
  fileKey!: string;
  fileSize!: number;
  url!: string | null;
  thumbnailUrl!: string | null;
  metadata!: Record<string, unknown>;
  referenceCount!: number;
  isInUse!: boolean;
  tags!: AssetTagResponseDto[];
  createdAt!: string;
  updatedAt!: string;
}

export class PaginatedAssetsResponseDto {
  items!: AssetResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}

export class AssetDownloadUrlResponseDto {
  url!: string;
  expiresIn!: number;
}

export class AssetFolderResponseDto {
  id!: string;
  tenantId!: string;
  parentId!: string | null;
  name!: string;
  createdAt!: string;
  updatedAt!: string;
}

export class AssetFoldersListResponseDto {
  items!: AssetFolderResponseDto[];
}

export class AssetTagsListResponseDto {
  items!: AssetTagResponseDto[];
}
