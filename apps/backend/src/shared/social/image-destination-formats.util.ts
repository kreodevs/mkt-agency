import {
  CM_PLATFORMS,
  type CmPlatform,
} from '../../modules/community-manager/domain/cm-platforms.constants';
import {
  type ImageGenerationSize,
  normalizeImageGenerationSize,
} from './image-generation-size.util';

const DEFAULT_SIZE_BY_PLATFORM: Record<CmPlatform, ImageGenerationSize> = {
  instagram: '1920x1920',
  facebook: '1920x1920',
  linkedin: '1920x1920',
  twitter: '1920x1920',
  tiktok: '1440x2560',
};

const PLATFORM_FORMAT_LABELS: Record<CmPlatform, string> = {
  instagram: 'Instagram — Post en feed (1:1)',
  facebook: 'Facebook — Post en feed (1:1)',
  linkedin: 'LinkedIn — Publicación (1:1)',
  twitter: 'X — Publicación (1:1)',
  tiktok: 'TikTok — Vertical (9:16)',
};

export function isCmPlatform(value: string | null | undefined): value is CmPlatform {
  return !!value && (CM_PLATFORMS as readonly string[]).includes(value);
}

export function resolveImageSizeForPlatform(
  platform: string | null | undefined,
): ImageGenerationSize {
  if (isCmPlatform(platform)) {
    return DEFAULT_SIZE_BY_PLATFORM[platform];
  }
  return '1920x1920';
}

export { normalizeImageGenerationSize, type ImageGenerationSize };

export function resolveImageStyleForPlatform(platform: string | null | undefined): string {
  const base = 'social media post, professional';
  if (!isCmPlatform(platform)) {
    return base;
  }

  const hints: Record<CmPlatform, string> = {
    instagram: 'Instagram feed square',
    facebook: 'Facebook feed square',
    linkedin: 'LinkedIn professional square',
    twitter: 'X/Twitter post square',
    tiktok: 'TikTok vertical 9:16 cover',
  };

  return `${hints[platform]}, ${base}`;
}

export function platformImageFormatLabel(platform: string | null | undefined): string | null {
  if (!isCmPlatform(platform)) {
    return null;
  }
  return PLATFORM_FORMAT_LABELS[platform];
}
