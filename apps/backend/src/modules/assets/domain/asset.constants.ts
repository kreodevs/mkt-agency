export const ASSET_TYPES = ['image', 'video', 'audio', 'document', 'other'] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export const MAX_ASSET_FILE_SIZE = 52_428_800; // 50 MB

export function inferAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType.includes('document') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation')
  ) {
    return 'document';
  }
  return 'other';
}
