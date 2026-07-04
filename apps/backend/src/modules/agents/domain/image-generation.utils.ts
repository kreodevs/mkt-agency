export type GenerationMediaType = 'image' | 'video';

const VIDEO_PROMPT_KEYWORDS =
  /\b(video|gif|animaci[oó]n|animado|motion|clip|reel|reels)\b/i;

const STATIC_CAROUSEL_KEYWORDS =
  /\b(carrusel|carousel|secuencia|story|stories|slides?|frames?)\b/i;

/** Frames for static carousel prompts (Image API returns one PNG per call). */
export const REEL_FRAME_COUNT = 3;

/** Ritmo medio de locución en español (palabras/segundo) para estimar duración. */
export const SPANISH_WORDS_PER_SECOND = 2.35;

export const MIN_VIDEO_DURATION = 4;
export const MAX_VIDEO_DURATION = 15;

export interface VideoDurationPolicy {
  minDuration: number;
  maxDuration: number;
  defaultDuration: number;
  /** Acorta el guion de voz del contenido al regenerar para caber en maxDuration. */
  truncateNarration: boolean;
}

const DEFAULT_VIDEO_DURATION_POLICY: VideoDurationPolicy = {
  minDuration: MIN_VIDEO_DURATION,
  maxDuration: MAX_VIDEO_DURATION,
  defaultDuration: 8,
  truncateNarration: false,
};

/** Límites por modelo según OpenRouter Video API (`/videos/models`). */
export function resolveVideoDurationPolicy(modelId?: string): VideoDurationPolicy {
  const id = modelId?.trim().toLowerCase() ?? '';

  if (id.includes('wan')) {
    return {
      minDuration: 2,
      maxDuration: 10,
      defaultDuration: 10,
      truncateNarration: true,
    };
  }

  if (id.includes('veo-3.1')) {
    return {
      minDuration: 4,
      maxDuration: 8,
      defaultDuration: 8,
      truncateNarration: true,
    };
  }

  return DEFAULT_VIDEO_DURATION_POLICY;
}

export function maxSpeakableWordsForDuration(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 0;
  }

  return Math.max(1, Math.floor(seconds * SPANISH_WORDS_PER_SECOND));
}

/**
 * Recorta el copy narrable a ~maxSeconds de locución, priorizando frases completas.
 */
export function fitNarrationBodyForDuration(body: string, maxSeconds: number): string {
  const script = sanitizeSpanishNarrationScript(body);
  if (!script || estimateSpeechDurationSeconds(script) <= maxSeconds) {
    return script;
  }

  const maxWords = maxSpeakableWordsForDuration(maxSeconds);
  const sentences = script.split(/(?<=[.!?…])\s+/).filter(Boolean);
  const kept: string[] = [];
  let wordCount = 0;

  for (const sentence of sentences) {
    const sentenceWords = countSpeakableWords(sentence);
    if (wordCount + sentenceWords <= maxWords) {
      kept.push(sentence);
      wordCount += sentenceWords;
      continue;
    }

    if (kept.length === 0) {
      const words = sentence.split(/\s+/).filter(Boolean);
      const truncated = words.slice(0, maxWords).join(' ');
      const cleaned = truncated.replace(/[,;:]+\s*$/, '').trim();
      kept.push(
        /[.!?…]$/.test(cleaned) ? cleaned : `${cleaned.replace(/…$/, '')}…`,
      );
    }

    break;
  }

  const fitted = kept.join(' ').trim();
  if (!fitted) {
    return script
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, maxWords)
      .join(' ');
  }

  return fitted;
}

export function countSpeakableWords(text: string): number {
  return text
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .replace(/[#*_`]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function estimateSpeechDurationSeconds(text: string): number {
  const words = countSpeakableWords(text);
  if (words === 0) {
    return 0;
  }

  return Math.ceil(words / SPANISH_WORDS_PER_SECOND);
}

function clampVideoDuration(seconds: number, policy?: VideoDurationPolicy): number {
  const min = policy?.minDuration ?? MIN_VIDEO_DURATION;
  const max = policy?.maxDuration ?? MAX_VIDEO_DURATION;
  const fallback = policy?.defaultDuration ?? 8;

  if (!Number.isFinite(seconds)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(seconds)));
}

function resolveVideoDurationFromPrompt(prompt: string): number {
  const match = prompt.match(/\b(\d{1,2})\s*(?:s|seg|segundos?)\b/i);
  if (match) {
    const seconds = Number.parseInt(match[1], 10);
    if (seconds >= MIN_VIDEO_DURATION && seconds <= MAX_VIDEO_DURATION) {
      return seconds;
    }
  }

  if (/\bgif\b/i.test(prompt)) {
    return 5;
  }

  if (/\breel\b/i.test(prompt)) {
    return 10;
  }

  return 8;
}

export function resolveVideoDuration(
  prompt: string,
  narrationBody?: string,
  policy?: VideoDurationPolicy,
): number {
  const fromPrompt = resolveVideoDurationFromPrompt(prompt);

  if (!narrationBody?.trim()) {
    const target = fromPrompt === 8 && policy?.defaultDuration ? policy.defaultDuration : fromPrompt;
    return clampVideoDuration(target, policy);
  }

  const fromNarration = estimateSpeechDurationSeconds(narrationBody);
  if (fromNarration <= 0) {
    const target = fromPrompt === 8 && policy?.defaultDuration ? policy.defaultDuration : fromPrompt;
    return clampVideoDuration(target, policy);
  }

  return clampVideoDuration(Math.max(fromPrompt, fromNarration), policy);
}

export function detectGenerationMediaType(prompt: string): GenerationMediaType {
  return VIDEO_PROMPT_KEYWORDS.test(prompt) ? 'video' : 'image';
}

/**
 * Evita que palabras como "video" en el copy del post (`Contexto:`) disparen Video API
 * al regenerar desde Contenidos.
 */
export function extractScenePromptForMediaDetection(prompt: string): string {
  const contextIndex = prompt.indexOf('Contexto:');
  return contextIndex >= 0 ? prompt.slice(0, contextIndex) : prompt;
}

export function resolveGenerationMediaType(
  prompt: string,
  options?: { contentLinked?: boolean; forced?: GenerationMediaType },
): GenerationMediaType {
  if (options?.forced) {
    return options.forced;
  }

  const detectionPrompt = options?.contentLinked
    ? extractScenePromptForMediaDetection(prompt)
    : prompt;

  return detectGenerationMediaType(detectionPrompt);
}

export function detectReelFrameCount(
  prompt: string,
  options?: { contentLinked?: boolean },
): number {
  if (resolveGenerationMediaType(prompt, options) === 'video') {
    return 1;
  }

  const detectionPrompt = options?.contentLinked
    ? extractScenePromptForMediaDetection(prompt)
    : prompt;

  return STATIC_CAROUSEL_KEYWORDS.test(detectionPrompt) ? REEL_FRAME_COUNT : 1;
}

export function formatGenerationError(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'Generation failed';

  if (/unexpected internal error/i.test(raw)) {
    return 'El proveedor de IA devolvió un error interno. Reintenta en unos minutos o cambia el modelo en Ajustes → Modelos por tarea.';
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { error?: { message?: string } };
      const providerMessage = parsed.error?.message?.trim();
      if (providerMessage) {
        return providerMessage;
      }
    } catch {
      // ignore malformed JSON tail
    }
  }

  return raw.length > 500 ? `${raw.slice(0, 497)}…` : raw;
}

export function resolveVideoAspectRatio(prompt: string): string {
  if (/\b(story|stories|reel|reels|vertical|9:16|tiktok|instagram)\b/i.test(prompt)) {
    return '9:16';
  }

  if (/\b(horizontal|landscape|16:9|youtube|linkedin)\b/i.test(prompt)) {
    return '16:9';
  }

  return '9:16';
}

export function shouldGenerateVideoAudio(prompt: string, narrationBody?: string): boolean {
  if (narrationBody?.trim()) {
    return true;
  }

  return /\b(m[uú]sica|audio|sonido|voz|narraci[oó]n|hablado|voiceover|trend|soundtrack|banda\s+sonora)\b/i.test(
    prompt,
  );
}

export function sanitizeSpanishNarrationScript(body: string): string {
  return body
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .replace(/[#*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 700);
}

export interface VideoGenerationPromptInput {
  basePrompt: string;
  title?: string;
  narrationBody?: string;
  durationSeconds?: number;
  narrationTruncated?: boolean;
}

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

export function buildFramePrompt(basePrompt: string, index: number, total: number): string {
  if (total <= 1) {
    return basePrompt;
  }

  return `${basePrompt}\n\nFrame ${index + 1} de ${total} para carrusel en redes. Mantén continuidad visual con los demás frames. Sin logos, monogramas ni iconos en esquinas (el logo real se añade después en software).`;
}

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