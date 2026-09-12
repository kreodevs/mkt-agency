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

export function buildMediaKitRevisionHint(feedback?: string | null): string {
  if (!feedbackRequestsMediaKit(feedback)) {
    return '';
  }

  return [
    'PRIORIDAD MEDIA KIT: el usuario pidió usar fotos/capturas reales del kit de medios.',
    'NO inventes escenas, empaques, productos físicos ni logos ficticios.',
    'visualDescription = cómo se verá la captura real en la plantilla (ej. captura desktop en MacBook).',
    'Ajusta visualHeadline, visualSubline y visualCta; el sistema maquetará con assets reales.',
  ].join(' ');
}
