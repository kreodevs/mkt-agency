import { getAccessToken } from '@/store/auth';
import { apiFetch } from '@/services/api';
import type {
  Asset,
  AssetDownloadUrlResponse,
  AssetFolder,
  AssetTag,
  AssetUrlVariant,
  ListAssetsParams,
  PaginatedAssetsResponse,
  UpdateAssetPayload,
  UploadAssetOptions,
} from '@/types/assets';

const API_BASE = '/api/v1';

export function getAssetFileUrl(
  assetId: string,
  variant: AssetUrlVariant = 'full',
): string | null {
  const token = getAccessToken();
  if (!token || !assetId) {
    return null;
  }

  const segment = variant === 'thumb' ? 'thumbnail' : 'file';
  return `${API_BASE}/assets/${assetId}/${segment}?access_token=${encodeURIComponent(token)}`;
}

export function resolveAssetPreviewUrl(
  asset: {
    id: string;
    url?: string | null;
    thumbnailUrl?: string | null;
  },
  options: { variant?: AssetUrlVariant } = {},
): string | null {
  const variant = options.variant ?? 'thumb';
  const authenticated = getAssetFileUrl(asset.id, variant);
  if (authenticated) {
    return authenticated;
  }

  if (variant === 'thumb' && asset.thumbnailUrl?.startsWith('http')) {
    return asset.thumbnailUrl;
  }

  if (asset.url?.startsWith('http')) {
    return asset.url;
  }

  return null;
}

function buildQuery(params: ListAssetsParams): string {
  const search = new URLSearchParams();
  if (params.folderId) search.set('folderId', params.folderId);
  if (params.unfiled) search.set('unfiled', 'true');
  if (params.type) search.set('type', params.type);
  if (params.tagIds) search.set('tagIds', params.tagIds);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listAssets(params: ListAssetsParams = {}): Promise<PaginatedAssetsResponse> {
  return apiFetch<PaginatedAssetsResponse>(`/assets${buildQuery(params)}`);
}

export async function getAsset(id: string): Promise<Asset> {
  return apiFetch<Asset>(`/assets/${id}`);
}

export async function updateAsset(id: string, payload: UpdateAssetPayload): Promise<Asset> {
  return apiFetch<Asset>(`/assets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAsset(id: string): Promise<void> {
  return apiFetch<void>(`/assets/${id}`, { method: 'DELETE' });
}

export async function duplicateAsset(id: string): Promise<Asset> {
  return apiFetch<Asset>(`/assets/${id}/duplicate`, { method: 'POST' });
}

export async function getAssetDownloadUrl(id: string): Promise<AssetDownloadUrlResponse> {
  return apiFetch<AssetDownloadUrlResponse>(`/assets/${id}/download-url`);
}

export async function listAssetFolders(): Promise<{ items: AssetFolder[] }> {
  return apiFetch<{ items: AssetFolder[] }>('/asset-folders');
}

export async function createAssetFolder(name: string, parentId?: string): Promise<AssetFolder> {
  return apiFetch<AssetFolder>('/asset-folders', {
    method: 'POST',
    body: JSON.stringify({ name, parentId: parentId ?? null }),
  });
}

export async function updateAssetFolder(
  id: string,
  payload: { name?: string; parentId?: string | null },
): Promise<AssetFolder> {
  return apiFetch<AssetFolder>(`/asset-folders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAssetFolder(id: string): Promise<void> {
  return apiFetch<void>(`/asset-folders/${id}`, { method: 'DELETE' });
}

export async function listAssetTags(): Promise<{ items: AssetTag[] }> {
  return apiFetch<{ items: AssetTag[] }>('/asset-tags');
}

export async function createAssetTag(name: string): Promise<AssetTag> {
  return apiFetch<AssetTag>('/asset-tags', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function uploadAsset(file: File, options: UploadAssetOptions = {}): Promise<Asset> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    if (options.folderId) formData.append('folderId', options.folderId);
    if (options.tagIds?.length) formData.append('tagIds', JSON.stringify(options.tagIds));

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        options.onProgress(event.loaded / event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as Asset);
        return;
      }

      try {
        const body = JSON.parse(xhr.responseText) as { error?: string };
        reject(new Error(body.error ?? 'Upload failed'));
      } catch {
        reject(new Error('Upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));

    xhr.open('POST', `${API_BASE}/assets/upload`);
    const token = getAccessToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
}
