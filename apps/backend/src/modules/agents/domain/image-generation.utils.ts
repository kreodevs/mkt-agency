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

function clampVideoDuration(seconds: number): number {
  if (!Number.isFinite(seconds)) {
    return 8;
  }

  return Math.min(MAX_VIDEO_DURATION, Math.max(MIN_VIDEO_DURATION, Math.round(seconds)));
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

  if (/\breel/i.test(prompt)) {
    return 10;
  }

  return 8;
}

export function resolveVideoDuration(prompt: string, narrationBody?: string): number {
  const fromPrompt = resolveVideoDurationFromPrompt(prompt);

  if (!narrationBody?.trim()) {
    return clampVideoDuration(fromPrompt);
  }

  const fromNarration = estimateSpeechDurationSeconds(narrationBody);
  if (fromNarration <= 0) {
    return clampVideoDuration(fromPrompt);
  }

  return clampVideoDuration(Math.max(fromPrompt, fromNarration));
}

export function detectGenerationMediaType(prompt: string): GenerationMediaType {
  return VIDEO_PROMPT_KEYWORDS.test(prompt) ? 'video' : 'image';
}

export function detectReelFrameCount(prompt: string): number {
  if (detectGenerationMediaType(prompt) === 'video') {
    return 1;
  }

  return STATIC_CAROUSEL_KEYWORDS.test(prompt) ? REEL_FRAME_COUNT : 1;
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

/** Anglicismos frecuentes que Seedance vocaliza mal si llegan al guion. */
const NARRATION_ANGLICISM_FIXES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\btechnology\b/gi, 'tecnología'],
  [/\btechnolog[yí]a\b/gi, 'tecnología'],
  [/\btechnologia\b/gi, 'tecnología'],
  [/\bsoftware\b/gi, 'software'],
  [/\bbranding\b/gi, 'branding'],
  [/\bplanner\b/gi, 'planner'],
];

const MAX_DIALOGUE_WORDS_PER_LINE = 9;

export function normalizeCopyForNarration(body: string): string {
  return body
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .replace(/[#*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 700);
}

export function sanitizeSpanishNarrationScript(body: string): string {
  let script = normalizeCopyForNarration(body);

  for (const [pattern, replacement] of NARRATION_ANGLICISM_FIXES) {
    script = script.replace(pattern, replacement);
  }

  return script;
}

function extractOrthographyAnchors(script: string, title?: string): string[] {
  const combined = `${title?.trim() ?? ''} ${script}`.trim();
  const anchors = new Set<string>();

  if (/tecnolog/i.test(combined)) {
    anchors.add('tecnología');
  }

  const accentWords = combined.match(/\b[\wáéíóúüñÁÉÍÓÚÜÑ]{4,}\b/gu) ?? [];
  for (const word of accentWords) {
    if (/[áéíóúüñ]/i.test(word)) {
      anchors.add(word);
    }
  }

  const properNouns =
    combined.match(/\b(?:[A-ZÁÉÍÓÚÜÑ][\wáéíóúüñ]*|[A-Za-z]*[A-Z][A-Za-záéíóúüñ0-9]*)\b/gu) ?? [];
  for (const word of properNouns) {
    if (word.length >= 4) {
      anchors.add(word);
    }
  }

  return [...anchors].slice(0, 16);
}

export function buildOrthographyGuardrails(script: string, title?: string): string {
  const anchors = extractOrthographyAnchors(script, title);
  const lines = [
    'REGLAS DE ORTOGRAFÍA Y LOCUTOR (obligatorias):',
    '- Idioma del audio: español de México (es-MX). Cero palabras en inglés salvo nombres propios de marca ya presentes en el guion.',
    '- Pronuncia literalmente el GUION DE VOZ; no parafrasees, no traduzcas, no sustituyas sinónimos ni anglicismos.',
    '- Respeta tildes, eñes y signos de puntuación del guion al hablar.',
    '- Prohibido decir "technology", "technología" u otras variantes incorrectas: usa "tecnología" (con c).',
  ];

  if (anchors.length > 0) {
    lines.push('- Ortografía exacta obligatoria en audio (y en texto en pantalla si aparece):');
    for (const word of anchors) {
      lines.push(`  • "${word}"`);
    }
  }

  return lines.join('\n');
}

function chunkDialogueLine(text: string, maxWords = MAX_DIALOGUE_WORDS_PER_LINE): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return [words.join(' ')];
  }

  const chunks: string[] = [];
  let current: string[] = [];

  for (const word of words) {
    current.push(word);
    const nextIsBreak =
      current.length >= maxWords ||
      /[,.;:!?…]$/.test(word) ||
      (current.length >= 6 && /^y$|^o$|^pero$|^con$|^sin$|^para$/i.test(word));

    if (nextIsBreak) {
      chunks.push(current.join(' '));
      current = [];
    }
  }

  if (current.length > 0) {
    chunks.push(current.join(' '));
  }

  return chunks;
}

/**
 * Formato recomendado por Seedance: diálogo citado, idioma explícito y frases cortas.
 */
export function formatNarrationDialogueForVideo(script: string): string {
  const sentences = script.split(/(?<=[.!?…])\s+/).filter(Boolean);
  const lines: string[] = [
    'AUDIO / DIÁLOGO — narrador en español de México (es-MX), voz clara de locutor de redes:',
  ];

  let index = 1;
  for (const sentence of sentences) {
    for (const chunk of chunkDialogueLine(sentence)) {
      lines.push(
        `${index}. El narrador dice en español, sin cambiar palabras: "${chunk}"`,
      );
      index += 1;
    }
  }

  return lines.join('\n');
}

export interface VideoGenerationPromptInput {
  basePrompt: string;
  title?: string;
  narrationBody?: string;
  durationSeconds?: number;
}

/**
 * Prompt enviado a la Video API: mismo base que el registro (UI) + guion de voz explícito.
 */
export function buildVideoGenerationPrompt(input: VideoGenerationPromptInput): string {
  const durationSeconds = input.durationSeconds ?? 8;
  const parts = [
    'Video corto para redes sociales.',
    `Duración objetivo del clip: ${durationSeconds} segundos.`,
    'ESCENA VISUAL (no vocalizar como diálogo):',
    input.basePrompt.trim(),
  ];

  if (input.narrationBody?.trim()) {
    const script = sanitizeSpanishNarrationScript(input.narrationBody);
    const estimatedSeconds = estimateSpeechDurationSeconds(script);
    const narrationHint =
      estimatedSeconds > durationSeconds
        ? ' Ritmo de locutor claro para cubrir todo el guion dentro de la duración, sin omitir frases.'
        : '';

    parts.push(buildOrthographyGuardrails(script, input.title));
    parts.push(
      `${formatNarrationDialogueForVideo(script)}${narrationHint}`,
    );
    parts.push(
      `GUION DE VOZ (texto literal obligatorio):\n"""${script}"""`,
    );
  }

  if (input.title?.trim()) {
    parts.push(
      `TEXTO EN PANTALLA (si aparece): "${input.title.trim()}". Ortografía española estricta; nunca "technology" ni "technología".`,
    );
  }

  parts.push(
    'La narración sigue el guion de voz palabra por palabra; el visual sigue la escena. No sustituyas el copy del post por un mensaje distinto.',
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
