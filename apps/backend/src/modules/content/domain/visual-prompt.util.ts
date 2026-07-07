/** Separa prompt de arte (escena visual) del copy publicable del post. */

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function stripHashtags(value: string): string {
  return value.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Detecta si el LLM (o un fallback) metió el body del post en visualDescription.
 */
export function isVisualPromptContaminatedWithCopy(
  visualPrompt: string,
  publishableBody?: string,
): boolean {
  const visual = normalizeText(visualPrompt);
  if (!visual) {
    return false;
  }

  if (/#\w+/.test(visual)) {
    return true;
  }

  const body = normalizeText(stripHashtags(publishableBody ?? ''));
  if (!body) {
    return false;
  }

  if (visual === body) {
    return true;
  }

  const bodySnippet = body.slice(0, Math.min(body.length, 120));
  if (bodySnippet.length >= 40 && visual.includes(bodySnippet)) {
    return true;
  }

  return false;
}

export function sanitizeVisualPromptForArt(
  visualPrompt: string | null | undefined,
  publishableBody?: string,
): string {
  const trimmed = visualPrompt?.trim() ?? '';
  if (!trimmed) {
    return '';
  }
  if (isVisualPromptContaminatedWithCopy(trimmed, publishableBody)) {
    return '';
  }
  return trimmed;
}

export function buildTitleOnlyVisualFallback(title: string): string {
  const cleanTitle = normalizeText(title);
  if (!cleanTitle) {
    return 'Escena visual profesional para redes sociales, sin texto del post en pantalla.';
  }
  return `Escena visual que ilustra el tema "${cleanTitle}" — composición fotográfica o editorial, sin copiar el texto del post ni hashtags.`;
}
