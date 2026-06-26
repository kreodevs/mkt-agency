export type AssetType = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface AssetTag {
  id: string;
  name: string;
}

export interface Asset {
  id: string;
  tenantId: string;
  folderId: string | null;
  name: string;
  type: AssetType;
  mimeType: string | null;
  fileKey: string;
  fileSize: number;
  url: string | null;
  metadata: Record<string, unknown>;
  referenceCount: number;
  isInUse: boolean;
  tags: AssetTag[];
  createdAt: string;
  updatedAt: string;
}

export interface AssetFolder {
  id: string;
  tenantId: string;
  parentId: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAssetsResponse {
  items: Asset[];
  total: number;
  page: number;
  limit: number;
}

export interface ListAssetsParams {
  folderId?: string;
  type?: AssetType;
  tagIds?: string;
  page?: number;
  limit?: number;
}

export interface UpdateAssetPayload {
  name?: string;
  folderId?: string | null;
  tagIds?: string[];
}

export interface AssetDownloadUrlResponse {
  url: string;
  expiresIn: number;
}

export interface UploadAssetOptions {
  folderId?: string;
  tagIds?: string[];
  onProgress?: (ratio: number) => void;
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  image: 'Imagen',
  video: 'Video',
  audio: 'Audio',
  document: 'Documento',
  other: 'Otro',
};
