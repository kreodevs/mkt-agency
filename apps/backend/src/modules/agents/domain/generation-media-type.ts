export type GenerationMediaType = 'image' | 'video';

export interface ImageGenerationFrameMeta {
  assetId: string;
  index: number;
}

export interface ImageGenerationMetadata {
  mediaType?: GenerationMediaType;
  intendedMediaType?: GenerationMediaType;
  mimeType?: string;
  duration?: number;
  frameCount: number;
  frames: ImageGenerationFrameMeta[];
}

export function isImageGenerationMetadata(value: unknown): value is ImageGenerationMetadata {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as ImageGenerationMetadata;
  return Array.isArray(record.frames);
}

const VIDEO_PROMPT_KEYWORDS =
  /\b(video|gif|animaci[oó]n|animado|motion|clip|reel|reels)\b/i;

export function detectGenerationMediaType(prompt: string): GenerationMediaType {
  return VIDEO_PROMPT_KEYWORDS.test(prompt) ? 'video' : 'image';
}

export function extractScenePromptForMediaDetection(prompt: string): string {
  const contextIndex = prompt.indexOf('Contexto:');
  return contextIndex >= 0 ? prompt.slice(0, contextIndex) : prompt;
}

export function resolveGenerationMediaType(
  prompt: string,
  options?: { contentLinked?: boolean; forced?: GenerationMediaType },
): GenerationMediaType {
  void prompt;
  void options;
  return 'image';
}

export function buildContentImagePrompt(title: string, body: string): string {
  const normalizedBody = body.replace(/\s+/g, ' ').trim().slice(0, 500);
  return [
    `Imagen para publicación en redes sociales: "${title.trim()}".`,
    normalizedBody ? `Contexto del copy: ${normalizedBody}` : '',
    'Estilo profesional, apto para Instagram/LinkedIn, sin texto superpuesto ilegible.',
  ]
    .filter(Boolean)
    .join(' ');
}
