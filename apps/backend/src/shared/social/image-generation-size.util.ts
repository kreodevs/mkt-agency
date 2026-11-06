/** Mínimo de píxeles exigido por modelos recientes (p. ej. flux.2-pro vía OpenRouter). */
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
 * Garantiza tamaño válido para Image API según el modelo configurado.
 * Para modelos de Google (Imagen) o OpenAI (DALL-E), restringe estrictamente a
 * tamaños estándar admitidos (1024x1024, 1024x1792, 1792x1024), ya que resoluciones
 * arbitrarias como 1920x1920 provocan error 400 (Request contains an invalid argument).
 * Para Flux y modelos de alta resolución, escala a ≥ MIN_IMAGE_GENERATION_PIXELS.
 */
export function normalizeImageGenerationSize(
  size: string,
  model?: string | null,
): ImageGenerationSize {
  const trimmed = size.trim();
  const parsed = parseSize(trimmed);

  const modelLower = model?.toLowerCase() ?? '';
  const isGoogle = modelLower.includes('google') || modelLower.includes('imagen');
  const isDallE = modelLower.includes('dall-e');

  if (isGoogle || isDallE) {
    const width = parsed?.width ?? 1024;
    const height = parsed?.height ?? 1024;
    if (height >= width * 1.2) {
      return '1024x1792';
    }
    if (width >= height * 1.2) {
      return '1792x1024';
    }
    return '1024x1024';
  }

  const mapped = LEGACY_SIZE_UPSCALE[trimmed];
  if (mapped) {
    return mapped as ImageGenerationSize;
  }

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
