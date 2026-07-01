const REEL_KEYWORDS =
  /\b(reel|carrusel|carousel|secuencia|story|stories|slides?|frames?)\b/i;

/** Frames for carousel/reel prompts (Image API returns one PNG per call). */
export const REEL_FRAME_COUNT = 3;

export function detectReelFrameCount(prompt: string): number {
  return REEL_KEYWORDS.test(prompt) ? REEL_FRAME_COUNT : 1;
}

export function buildFramePrompt(basePrompt: string, index: number, total: number): string {
  if (total <= 1) {
    return basePrompt;
  }

  return `${basePrompt}\n\nCarousel frame ${index + 1} of ${total} for a social media reel. Keep visual continuity with the other frames.`;
}

export interface ImageGenerationFrameMeta {
  assetId: string;
  index: number;
}

export interface ImageGenerationMetadata {
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
