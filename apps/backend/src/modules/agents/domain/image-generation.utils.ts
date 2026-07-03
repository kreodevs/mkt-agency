export type GenerationMediaType = 'image' | 'video';

const VIDEO_PROMPT_KEYWORDS =
  /\b(video|gif|animaci[oó]n|animado|motion|clip|reel|reels)\b/i;

const STATIC_CAROUSEL_KEYWORDS =
  /\b(carrusel|carousel|secuencia|story|stories|slides?|frames?)\b/i;

/** Frames for static carousel prompts (Image API returns one PNG per call). */
export const REEL_FRAME_COUNT = 3;

export function detectGenerationMediaType(prompt: string): GenerationMediaType {
  return VIDEO_PROMPT_KEYWORDS.test(prompt) ? 'video' : 'image';
}

export function detectReelFrameCount(prompt: string): number {
  if (detectGenerationMediaType(prompt) === 'video') {
    return 1;
  }

  return STATIC_CAROUSEL_KEYWORDS.test(prompt) ? REEL_FRAME_COUNT : 1;
}

export function resolveVideoDuration(prompt: string): number {
  const match = prompt.match(/\b(\d{1,2})\s*(?:s|seg|segundos?)\b/i);
  if (match) {
    const seconds = Number.parseInt(match[1], 10);
    if (seconds >= 4 && seconds <= 15) {
      return seconds;
    }
  }

  if (/\bgif\b/i.test(prompt)) {
    return 5;
  }

  if (/\breel/i.test(prompt)) {
    return 10;
  }

  return 8;
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

export function normalizeCopyForNarration(body: string): string {
  return body
    .replace(/[#*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 700);
}

export interface VideoGenerationPromptInput {
  basePrompt: string;
  title?: string;
  narrationBody?: string;
}

/**
 * Prompt enviado a la Video API: mismo base que el registro (UI) + guion de voz explícito.
 */
export function buildVideoGenerationPrompt(input: VideoGenerationPromptInput): string {
  const parts = [
    'Video corto para redes sociales con narración hablada en español (México).',
    input.basePrompt.trim(),
  ];

  if (input.narrationBody?.trim()) {
    const script = normalizeCopyForNarration(input.narrationBody);
    parts.push(
      `GUION DE VOZ — el audio hablado debe decir exactamente este texto, sin omitir frases ni inventar palabras en inglés:\n"""${script}"""`,
    );
  }

  if (input.title?.trim()) {
    parts.push(
      `Texto en pantalla (si aparece): "${input.title.trim()}". Usa ortografía española (ej. "tecnología" con c, nunca "technology" ni "technología").`,
    );
  }

  parts.push(
    'La narración sigue el guion de voz; el visual sigue la escena del prompt. No sustituyas el copy del post por un mensaje distinto.',
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
