import type { CmCharacterAppearance, CmCharacterConfig } from './cm-character.constants';

export function parseCmCharacterConfig(
  metadata: Record<string, unknown> | null | undefined,
): CmCharacterConfig | null {
  const raw = metadata?.cmCharacter;
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  return raw as CmCharacterConfig;
}

export function isCmCharacterReady(config: CmCharacterConfig | null | undefined): boolean {
  return Boolean(config?.readyAt && config?.portraitAssetId);
}

export function buildCmPortraitPrompt(
  appearance: CmCharacterAppearance | undefined,
  brandHints?: { industry?: string | null; brandVoice?: string | null },
): string {
  const gender =
    appearance?.gender === 'male'
      ? 'hombre profesional'
      : appearance?.gender === 'neutral'
        ? 'persona andrógina profesional'
        : 'mujer profesional';
  const age = appearance?.ageRange?.trim() || '30-40 años';
  const style = appearance?.style?.trim() || 'business casual moderno, amable y confiable';
  const background =
    appearance?.background?.trim() ||
    'fondo de estudio suave con tonos de marca, desenfocado';
  const notes = appearance?.notes?.trim();
  const brand =
    brandHints?.brandVoice?.trim() || brandHints?.industry?.trim()
      ? `Contexto de marca: ${[brandHints.brandVoice, brandHints.industry].filter(Boolean).join(' · ')}.`
      : '';

  return [
    'Retrato fotorealista vertical 9:16 de una community manager virtual para redes sociales.',
    `Sujeto: ${gender}, ${age}, ${style}.`,
    `Ambiente: ${background}.`,
    'Encuadre: plano medio, hombros visibles, mirada directa a cámara, expresión cálida y profesional.',
    'Iluminación de estudio suave, piel natural, sin filtros exagerados.',
    brand,
    notes ? `Notas: ${notes}.` : '',
    'Sin texto, sin logos, sin marcas de agua, sin objetos en primer plano que tapen el rostro.',
  ]
    .filter(Boolean)
    .join(' ');
}

export function mergeCmCharacterConfig(
  current: CmCharacterConfig | null,
  patch: Partial<CmCharacterConfig>,
): CmCharacterConfig {
  return {
    ...current,
    ...patch,
    appearance: {
      ...current?.appearance,
      ...patch.appearance,
    },
  };
}
