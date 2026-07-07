export type ContentVisualFormat = 'image' | 'carousel';

export const CONTENT_VISUAL_FORMATS: ContentVisualFormat[] = ['image', 'carousel'];

export const CONTENT_VISUAL_FORMAT_LABELS: Record<ContentVisualFormat, string> = {
  image: 'Imagen',
  carousel: 'Carrusel',
};

export const CONTENT_VISUAL_FORMAT_HINTS: Record<ContentVisualFormat, string> = {
  image: 'Post estático para feed, LinkedIn o TikTok (imagen vertical).',
  carousel: 'Secuencia de 3 imágenes para carrusel.',
};

export function normalizeContentVisualFormat(value: unknown): ContentVisualFormat {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'video') {
    return 'image';
  }
  if ((CONTENT_VISUAL_FORMATS as readonly string[]).includes(raw)) {
    return raw as ContentVisualFormat;
  }
  return 'image';
}
