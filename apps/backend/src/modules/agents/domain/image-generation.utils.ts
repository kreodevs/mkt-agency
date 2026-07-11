/**
 * Image Generation Utils — Re-export barrel.
 *
 * Functions have been split into focused modules:
 * - generation-media-type.ts: GenerationMediaType, ImageGenerationMetadata, isImageGenerationMetadata, etc.
 * - video-duration-policy.ts: resolveVideoDurationPolicy, resolveVideoDuration, resolveVideoAspectRatio
 * - video-narration.utils.ts: splitNarrationIntoSegments, estimateSpeechDurationSeconds, etc.
 * - image-frame.utils.ts: buildFramePrompt, detectReelFrameCount
 * - generation-error.utils.ts: formatGenerationError, isStaleProcessingGeneration, etc.
 */

export {
  type GenerationMediaType,
  type ImageGenerationFrameMeta,
  type ImageGenerationMetadata,
  isImageGenerationMetadata,
  detectGenerationMediaType,
  extractScenePromptForMediaDetection,
  resolveGenerationMediaType,
  buildContentImagePrompt,
} from './generation-media-type';

export {
  type VideoDurationPolicy,
  MIN_VIDEO_DURATION,
  MAX_VIDEO_DURATION,
  resolveVideoDurationPolicy,
  resolveVideoDuration,
  resolveVideoAspectRatio,
} from './video-duration-policy';

export {
  type NarrationSegment,
  SPANISH_WORDS_PER_SECOND,
  maxSpeakableWordsForDuration,
  countSpeakableWords,
  estimateSpeechDurationSeconds,
  sanitizeSpanishNarrationScript,
  fitNarrationBodyForDuration,
  shouldGenerateVideoAudio,
  splitNarrationIntoSegments,
} from './video-narration.utils';

export {
  REEL_FRAME_COUNT,
  buildFramePrompt,
  detectReelFrameCount,
} from './image-frame.utils';

export {
  IMAGE_GENERATION_STALE_PROCESSING_MS,
  IMAGE_GENERATION_STALE_PROCESSING_MESSAGE,
  formatGenerationError,
  isStaleProcessingGeneration,
} from './generation-error.utils';

export interface VideoGenerationPromptInput {
  basePrompt: string;
  title?: string;
  narrationBody?: string;
  durationSeconds?: number;
  narrationTruncated?: boolean;
}

import { sanitizeSpanishNarrationScript } from './video-narration.utils';

/**
 * Prompt enviado a la Video API: mismo base que el registro (UI) + guion de voz explícito.
 */
export function buildVideoGenerationPrompt(input: VideoGenerationPromptInput): string {
  const script = input.narrationBody?.trim()
    ? sanitizeSpanishNarrationScript(input.narrationBody)
    : '';

  const parts = [
    'Video corto para redes sociales.',
    `Duración objetivo del clip: ${input.durationSeconds ?? 8} segundos.`,
    'ESCENA VISUAL (no vocalizar como diálogo):',
    input.basePrompt.trim(),
  ];

  if (script) {
    parts.push(
      `Narración en español de México (es-MX), pronunciación perfecta:
"""${script}"""`,
    );
  }

  if (input.title?.trim()) {
    parts.push(
      `TEXTO EN PANTALLA (si aparece): "${input.title.trim()}" (ortografía española estricta).`,
    );
  }

  parts.push(
    'La narración sigue el guion de voz palabra por palabra; el visual sigue la escena.',
  );

  return parts.join('\n\n');
}
