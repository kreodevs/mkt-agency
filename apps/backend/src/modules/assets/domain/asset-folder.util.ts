import type { AssetFolderEntity } from '../infrastructure/typeorm/asset-folder.entity';

export type AssetDeviceHint = 'pc' | 'ipad' | 'ios';

const DEVICE_PATTERNS: Array<{ device: AssetDeviceHint; pattern: RegExp }> = [
  { device: 'ios', pattern: /\bios\b|iphone|móvil|movil|mobile/i },
  { device: 'ipad', pattern: /\bipad\b|tablet/i },
  { device: 'pc', pattern: /\bpc\b|desktop|escritorio|mac|windows|web/i },
];

export function inferDeviceFromFolderName(name: string): AssetDeviceHint | null {
  for (const { device, pattern } of DEVICE_PATTERNS) {
    if (pattern.test(name)) {
      return device;
    }
  }
  return null;
}

export function buildFolderPathMap(
  folders: Pick<AssetFolderEntity, 'id' | 'name' | 'parentId'>[],
): Map<string, string> {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const cache = new Map<string, string>();

  const resolve = (folderId: string): string => {
    const cached = cache.get(folderId);
    if (cached) {
      return cached;
    }

    const folder = byId.get(folderId);
    if (!folder) {
      return '';
    }

    const path = folder.parentId
      ? `${resolve(folder.parentId)}/${folder.name}`
      : folder.name;
    cache.set(folderId, path);
    return path;
  };

  for (const folder of folders) {
    resolve(folder.id);
  }

  return cache;
}

export function inferDeviceFromFolderPath(path: string): AssetDeviceHint | null {
  const segments = path.split('/');
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const device = inferDeviceFromFolderName(segments[i]);
    if (device) {
      return device;
    }
  }
  return null;
}

export function preferredDevicesForPlatform(
  platform: string | undefined,
): AssetDeviceHint[] {
  switch (platform) {
    case 'tiktok':
    case 'instagram':
      return ['ios', 'ipad', 'pc'];
    case 'linkedin':
    case 'facebook':
      return ['pc', 'ipad', 'ios'];
    case 'twitter':
      return ['ios', 'pc', 'ipad'];
    default:
      return ['ios', 'ipad', 'pc'];
  }
}
