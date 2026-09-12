const MEDIA_KIT_FEEDBACK_PATTERNS: RegExp[] = [
  /\bmedia\s*kit\b/i,
  /\bkit\s+de\s+medios\b/i,
  /\bfotos?\s+reales?\b/i,
  /\bcapturas?\b/i,
  /\busa(r)?\s+(las\s+|mis\s+|del\s+)?(im[aá]genes|fotos|capturas)\b/i,
  /\busar\s+(las\s+|mis\s+|del\s+)?(im[aá]genes|fotos)\b/i,
  /\bdel\s+kit\b/i,
  /\bde\s+la\s+librer[ií]a\b/i,
  /\bno\s+gener(es|ar)\b.*\b(im[aá]gen|foto|logo)\b/i,
  /\b(im[aá]genes|fotos)\s+del\s+(producto|kit|media)\b/i,
];

const AI_IMAGE_FEEDBACK_PATTERNS: RegExp[] = [
  /\bgener(a|ar)\s+(una\s+)?(nueva\s+)?im[aá]gen\b/i,
  /\bim[aá]gen\s+con\s+ia\b/i,
  /\billustraci[oó]n\b/i,
  /\bdibuja\b/i,
];

export function feedbackRequestsMediaKit(feedback?: string | null): boolean {
  const text = feedback?.trim();
  if (!text) {
    return false;
  }
  return MEDIA_KIT_FEEDBACK_PATTERNS.some((pattern) => pattern.test(text));
}

export function feedbackRequestsAiImage(feedback?: string | null): boolean {
  const text = feedback?.trim();
  if (!text) {
    return false;
  }
  return AI_IMAGE_FEEDBACK_PATTERNS.some((pattern) => pattern.test(text));
}

const FRAME_INDEX_PATTERN =
  /\b(?:frame|frames?|slide|slides?|diapositiva|diapositivas?)\s*(\d{1,2})\b/gi;

/** Índices 0-based de slides a regenerar; null = todos. */
export function parseFeedbackTargetFrames(
  feedback?: string | null,
  slideCount = 3,
): number[] | null {
  const text = feedback?.trim();
  if (!text || slideCount < 2) {
    return null;
  }

  const indices = new Set<number>();
  for (const match of text.matchAll(FRAME_INDEX_PATTERN)) {
    const frameNumber = Number.parseInt(match[1] ?? '', 10);
    if (frameNumber >= 1 && frameNumber <= slideCount) {
      indices.add(frameNumber - 1);
    }
  }

  if (indices.size === 0) {
    return null;
  }

  return [...indices].sort((a, b) => a - b);
}

export function buildMediaKitRevisionHint(feedback?: string | null): string {
  if (!feedbackRequestsMediaKit(feedback)) {
    return '';
  }

  const targetFrames = parseFeedbackTargetFrames(feedback);
  const frameHint = targetFrames?.length
    ? `Regenera SOLO los frames ${targetFrames.map((i) => i + 1).join(', ')}; conserva el resto si no se mencionan.`
    : 'Regenera todos los frames del carrusel con capturas distintas del kit.';

  return [
    'PRIORIDAD MEDIA KIT: el usuario pidió usar fotos/capturas reales del kit de medios.',
    'NO inventes escenas, empaques, productos físicos ni logos ficticios.',
    'visualDescription = cómo se verá la captura real en la plantilla (ej. captura iOS en mockup móvil).',
    frameHint,
    'Carrusel: body con 3 bullets/líneas (una por slide). visualHeadline=solo hook slide 1; visualCta=titular slide final; no repitas el mismo titular en los 3 frames.',
    'Ajusta visualHeadline, visualSubline y visualCta; el sistema maquetará con assets reales.',
  ].join(' ');
}
