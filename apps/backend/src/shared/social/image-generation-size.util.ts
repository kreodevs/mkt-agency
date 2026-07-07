/** Mínimo de píxeles exigido por modelos recientes (p. ej. flux-2-pro vía OpenRouter). */
export const MIN_IMAGE_GENERATION_PIXELS = 3_686_400;

const LEGACY_SIZE_UPSCALE: Record<string, string> = {
  '1024x1024': '1920x1920',
  '1792x1024': '2560x1440',
  '1024x1792': '1440x2560',
};

export type ImageGenerationSize =
  | '1920x1920'
  | '2560x1440'
  | '1440x2560'
  | '1024x1024'
  | '1792x1024'
  | '1024x1792';

function parseSize(size: string): { width: number; height: number } | null {
  const match = /^(\d+)x(\d+)$/.exec(size.trim());
  if (!match) {
    return null;
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return { width, height };
}

/**
 * Garantiza tamaño válido para Image API (≥ MIN_IMAGE_GENERATION_PIXELS).
 * Mapea tamaños legacy del CM a equivalentes de mayor resolución.
 */
export function normalizeImageGenerationSize(size: string): ImageGenerationSize {
  const trimmed = size.trim();
  const mapped = LEGACY_SIZE_UPSCALE[trimmed];
  if (mapped) {
    return mapped as ImageGenerationSize;
  }

  const parsed = parseSize(trimmed);
  if (!parsed) {
    return '1920x1920';
  }

  const pixels = parsed.width * parsed.height;
  if (pixels >= MIN_IMAGE_GENERATION_PIXELS) {
    return `${parsed.width}x${parsed.height}` as ImageGenerationSize;
  }

  const scale = Math.sqrt(MIN_IMAGE_GENERATION_PIXELS / pixels);
  let width = Math.max(1, Math.round(parsed.width * scale));
  let height = Math.max(1, Math.round(parsed.height * scale));

  while (width * height < MIN_IMAGE_GENERATION_PIXELS) {
    if (width <= height) {
      width += 1;
    } else {
      height += 1;
    }
  }

  return `${width}x${height}` as ImageGenerationSize;
}
