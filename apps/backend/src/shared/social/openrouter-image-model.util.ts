/** Slug correcto en OpenRouter Image API (punto, no guion). */
export const OPENROUTER_FLUX_2_PRO_MODEL = 'black-forest-labs/flux.2-pro';

const LEGACY_FLUX_SLUGS: Record<string, string> = {
  'black-forest-labs/flux-2-pro': OPENROUTER_FLUX_2_PRO_MODEL,
  'black-forest-labs/flux-2-flex': 'black-forest-labs/flux.2-flex',
  'black-forest-labs/flux-2-klein': 'black-forest-labs/flux.2-klein',
  'black-forest-labs/flux-2-klein-4b': 'black-forest-labs/flux.2-klein-4b',
};

export function normalizeOpenRouterImageModel(model: string | null | undefined): string {
  const trimmed = model?.trim();
  if (!trimmed) {
    return OPENROUTER_FLUX_2_PRO_MODEL;
  }
  return LEGACY_FLUX_SLUGS[trimmed] ?? trimmed;
}
