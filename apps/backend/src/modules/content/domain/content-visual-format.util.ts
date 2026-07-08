import {
  CAROUSEL_FRAME_COUNT,
  CONTENT_VISUAL_FORMATS,
  DEFAULT_CONTENT_VISUAL_FORMAT,
  LEGACY_VIDEO_VISUAL_FORMAT,
  type ContentVisualFormat,
} from './content.constants';

export function normalizeContentVisualFormat(value: unknown): ContentVisualFormat {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase();

  if (raw === LEGACY_VIDEO_VISUAL_FORMAT) {
    return DEFAULT_CONTENT_VISUAL_FORMAT;
  }

  if ((CONTENT_VISUAL_FORMATS as readonly string[]).includes(raw)) {
    return raw as ContentVisualFormat;
  }

  return DEFAULT_CONTENT_VISUAL_FORMAT;
}

export function inferContentVisualFormat(
  _platform: string | null | undefined,
  explicit?: string | null,
): ContentVisualFormat {
  const normalized = explicit?.trim().toLowerCase();
  if (normalized === LEGACY_VIDEO_VISUAL_FORMAT) {
    return DEFAULT_CONTENT_VISUAL_FORMAT;
  }
  if (normalized && (CONTENT_VISUAL_FORMATS as readonly string[]).includes(normalized)) {
    return normalized as ContentVisualFormat;
  }

  return DEFAULT_CONTENT_VISUAL_FORMAT;
}

/** Generación IA de video generativo deshabilitada; talking-head usa lip-sync sobre retrato. */
export function visualFormatToMediaType(format: ContentVisualFormat): 'image' | 'video' {
  if (format === 'talking-head') {
    return 'video';
  }
  return 'image';
}

export function visualFormatToFrameCount(format: ContentVisualFormat): number {
  if (format === 'carousel') {
    return CAROUSEL_FRAME_COUNT;
  }

  return 1;
}

export function buildVisualFormatSceneHint(format: ContentVisualFormat): string {
  switch (format) {
    case 'carousel':
      return `Formato visual: carrusel de ${CAROUSEL_FRAME_COUNT} imágenes relacionadas para redes sociales.`;
    case 'talking-head':
      return 'Formato visual: reel vertical con la CM virtual hablando el copy del post (retrato + lip-sync).';
    default:
      return 'Formato visual: imagen estática para feed o post en redes sociales.';
  }
}

export const CONTENT_VISUAL_FORMAT_LABELS: Record<ContentVisualFormat, string> = {
  image: 'Imagen',
  carousel: 'Carrusel',
  'talking-head': 'CM hablando',
};
