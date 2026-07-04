import {
  CAROUSEL_FRAME_COUNT,
  CONTENT_VISUAL_FORMATS,
  DEFAULT_CONTENT_VISUAL_FORMAT,
  type ContentVisualFormat,
} from './content.constants';

export function normalizeContentVisualFormat(value: unknown): ContentVisualFormat {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase();

  if ((CONTENT_VISUAL_FORMATS as readonly string[]).includes(raw)) {
    return raw as ContentVisualFormat;
  }

  return DEFAULT_CONTENT_VISUAL_FORMAT;
}

export function inferContentVisualFormat(
  platform: string | null | undefined,
  explicit?: string | null,
): ContentVisualFormat {
  const normalized = explicit?.trim().toLowerCase();
  if (normalized && (CONTENT_VISUAL_FORMATS as readonly string[]).includes(normalized)) {
    return normalized as ContentVisualFormat;
  }

  if (platform === 'tiktok') {
    return 'video';
  }

  return DEFAULT_CONTENT_VISUAL_FORMAT;
}

export function visualFormatToMediaType(format: ContentVisualFormat): 'image' | 'video' {
  return format === 'video' ? 'video' : 'image';
}

export function visualFormatToFrameCount(format: ContentVisualFormat): number {
  if (format === 'carousel') {
    return CAROUSEL_FRAME_COUNT;
  }

  return 1;
}

export function buildVisualFormatSceneHint(format: ContentVisualFormat): string {
  switch (format) {
    case 'video':
      return 'Formato visual: video corto vertical para redes con narración hablada en español.';
    case 'carousel':
      return `Formato visual: carrusel de ${CAROUSEL_FRAME_COUNT} imágenes relacionadas para redes sociales.`;
    default:
      return 'Formato visual: imagen estática para feed o post en redes sociales.';
  }
}

export const CONTENT_VISUAL_FORMAT_LABELS: Record<ContentVisualFormat, string> = {
  image: 'Imagen',
  video: 'Video',
  carousel: 'Carrusel',
};
