export type ContentVisualFormat = 'image' | 'video' | 'carousel';

export const CONTENT_VISUAL_FORMATS: ContentVisualFormat[] = ['image', 'video', 'carousel'];

export const CONTENT_VISUAL_FORMAT_LABELS: Record<ContentVisualFormat, string> = {
  image: 'Imagen',
  video: 'Video',
  carousel: 'Carrusel',
};

export const CONTENT_VISUAL_FORMAT_HINTS: Record<ContentVisualFormat, string> = {
  image: 'Post estático para feed o LinkedIn.',
  video: 'Clip corto con narración del cuerpo del post (Seedance).',
  carousel: 'Secuencia de 3 imágenes para carrusel.',
};

export function normalizeContentVisualFormat(value: unknown): ContentVisualFormat {
  const raw = String(value ?? '').trim().toLowerCase();
  if ((CONTENT_VISUAL_FORMATS as readonly string[]).includes(raw)) {
    return raw as ContentVisualFormat;
  }
  return 'image';
}
