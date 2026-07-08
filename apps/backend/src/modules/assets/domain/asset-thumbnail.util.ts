import sharp from '@/shared/media/sharp.util';

export const ASSET_THUMBNAIL_MAX_WIDTH = 480;
export const ASSET_THUMBNAIL_QUALITY = 80;
export const ASSET_THUMBNAIL_MIME_TYPE = 'image/webp';

export const ASSET_METADATA_THUMBNAIL_FILE_KEY = 'thumbnailFileKey';
export const ASSET_METADATA_THUMBNAIL_MIME_TYPE = 'thumbnailMimeType';
export const ASSET_METADATA_THUMBNAIL_FILE_SIZE = 'thumbnailFileSize';

export function buildThumbnailFileKey(originalFileKey: string): string {
  const slash = originalFileKey.lastIndexOf('/');
  const dir = slash >= 0 ? originalFileKey.slice(0, slash) : originalFileKey;
  return `${dir}/thumb.webp`;
}

export function readThumbnailFileKey(metadata: Record<string, unknown>): string | null {
  const value = metadata[ASSET_METADATA_THUMBNAIL_FILE_KEY];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export async function generateImageThumbnail(buffer: Buffer): Promise<Buffer | null> {
  try {
    return await sharp(buffer)
      .rotate()
      .resize({
        width: ASSET_THUMBNAIL_MAX_WIDTH,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: ASSET_THUMBNAIL_QUALITY })
      .toBuffer();
  } catch {
    return null;
  }
}
