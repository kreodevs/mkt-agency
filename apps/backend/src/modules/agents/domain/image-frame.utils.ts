import { extractScenePromptForMediaDetection } from './generation-media-type';

export const REEL_FRAME_COUNT = 3;

const STATIC_CAROUSEL_KEYWORDS =
  /\b(carrusel|carousel|secuencia|story|stories|slides?|frames?)\b/i;

export function buildFramePrompt(basePrompt: string, index: number, total: number): string {
  if (total <= 1) {
    return basePrompt;
  }

  return `${basePrompt}\n\nFrame ${index + 1} de ${total} para carrusel en redes. Mantén continuidad visual con los demás frames. Sin logos, monogramas ni iconos en esquinas (el logo real se añade después en software).`;
}

export function detectReelFrameCount(
  prompt: string,
  options?: { contentLinked?: boolean; forcedFrameCount?: number },
): number {
  if (options?.forcedFrameCount && options.forcedFrameCount > 1) {
    return options.forcedFrameCount;
  }

  const detectionPrompt = options?.contentLinked
    ? extractScenePromptForMediaDetection(prompt)
    : prompt;

  return STATIC_CAROUSEL_KEYWORDS.test(detectionPrompt) ? REEL_FRAME_COUNT : 1;
}
