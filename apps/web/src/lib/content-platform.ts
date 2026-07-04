import type { CmPlatform } from '@/services/community-manager';

export const CONTENT_PLATFORMS: readonly CmPlatform[] = [
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'twitter',
] as const;

export const CONTENT_PLATFORM_LABELS: Record<CmPlatform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  twitter: 'X / Twitter',
};

export const CONTENT_PLATFORM_HINTS: Record<CmPlatform, string> = {
  instagram: 'Post, Story o Reel en Instagram',
  facebook: 'Publicación o Story en Facebook',
  linkedin: 'Publicación profesional en LinkedIn',
  tiktok: 'Video corto en TikTok',
  twitter: 'Publicación en X (Twitter)',
};

export function isContentPlatform(value: string | null | undefined): value is CmPlatform {
  return !!value && (CONTENT_PLATFORMS as readonly string[]).includes(value);
}

export function getContentPlatformLabel(platform: string | null | undefined): string | null {
  if (!platform) {
    return null;
  }

  if (isContentPlatform(platform)) {
    return CONTENT_PLATFORM_LABELS[platform];
  }

  return platform;
}

export function buildPostCopyText(title: string, body: string): string {
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();

  if (trimmedTitle && trimmedBody) {
    return `${trimmedTitle}\n\n${trimmedBody}`;
  }

  return trimmedTitle || trimmedBody;
}

/** Abre la red en web (el SOHO pega el copy manualmente). */
export function getPlatformPublishUrl(platform: string | null | undefined): string | null {
  if (!isContentPlatform(platform)) {
    return null;
  }

  const urls: Record<CmPlatform, string> = {
    instagram: 'https://www.instagram.com/',
    facebook: 'https://www.facebook.com/',
    linkedin: 'https://www.linkedin.com/feed/',
    tiktok: 'https://www.tiktok.com/upload',
    twitter: 'https://twitter.com/compose/tweet',
  };

  return urls[platform];
}

/** Compartir copy por WhatsApp (útil para SOHO local). */
export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function slugifyForFilename(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'contenido'
  );
}
