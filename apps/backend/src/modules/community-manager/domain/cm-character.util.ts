import { randomUUID } from 'crypto';
import {
  CM_CHARACTERS_LIBRARY_KEY,
  CM_CHARACTER_METADATA_KEY,
  DEFAULT_CM_VOICE_ID,
  DEFAULT_CM_VOICE_NAME,
  type CmCharacterAppearance,
  type CmCharacterConfig,
  type CmCharacterEntry,
  type CmCharacterLlmOption,
  type CmCharactersLibrary,
} from './cm-character.constants';

export function parseCmCharacterConfig(
  metadata: Record<string, unknown> | null | undefined,
): CmCharacterConfig | null {
  const raw = metadata?.[CM_CHARACTER_METADATA_KEY];
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  return raw as CmCharacterConfig;
}

export function parseCmCharactersLibrary(
  metadata: Record<string, unknown> | null | undefined,
): CmCharactersLibrary {
  const raw = metadata?.[CM_CHARACTERS_LIBRARY_KEY];
  if (raw && typeof raw === 'object' && Array.isArray((raw as CmCharactersLibrary).characters)) {
    const library = raw as CmCharactersLibrary;
    return {
      characters: library.characters ?? [],
      defaultCharacterId: library.defaultCharacterId ?? null,
    };
  }

  const legacy = parseCmCharacterConfig(metadata);
  if (legacy) {
    const id = randomUUID();
    return {
      characters: [
        {
          id,
          name: 'CM principal',
          ...legacy,
        },
      ],
      defaultCharacterId: id,
    };
  }

  return { characters: [], defaultCharacterId: null };
}

export function isCmCharacterReady(config: CmCharacterConfig | null | undefined): boolean {
  return Boolean(config?.readyAt && config?.portraitAssetId);
}

export function isCmCharacterEntryReady(entry: CmCharacterEntry | null | undefined): boolean {
  return isCmCharacterReady(entry);
}

export function getDefaultCharacter(library: CmCharactersLibrary): CmCharacterEntry | null {
  if (!library.characters.length) {
    return null;
  }
  if (library.defaultCharacterId) {
    const found = library.characters.find((c) => c.id === library.defaultCharacterId);
    if (found) {
      return found;
    }
  }
  return library.characters[0] ?? null;
}

export function getCharacterById(
  library: CmCharactersLibrary,
  characterId: string,
): CmCharacterEntry | null {
  return library.characters.find((c) => c.id === characterId) ?? null;
}

export function listReadyCharacters(library: CmCharactersLibrary): CmCharacterEntry[] {
  return library.characters.filter((entry) => isCmCharacterEntryReady(entry));
}

export function summarizeCharacterForLlm(entry: CmCharacterEntry): CmCharacterLlmOption {
  const appearance = entry.appearance ?? {};
  const gender =
    appearance.gender === 'male'
      ? 'hombre'
      : appearance.gender === 'neutral'
        ? 'persona neutral'
        : 'mujer';
  const parts = [
    gender,
    appearance.ageRange?.trim(),
    appearance.style?.trim(),
    appearance.notes?.trim(),
  ].filter(Boolean);

  return {
    id: entry.id,
    name: entry.name,
    summary: parts.length > 0 ? parts.join(' · ') : 'presentadora de marca',
  };
}

export function createCmCharacterEntry(name: string): CmCharacterEntry {
  return {
    id: randomUUID(),
    name: name.trim() || 'Nueva CM',
    status: 'pending',
    voiceId: DEFAULT_CM_VOICE_ID,
    voiceName: DEFAULT_CM_VOICE_NAME,
    portraitAssetId: null,
    previewVideoAssetId: null,
    readyAt: null,
    errorMessage: null,
    appearance: { gender: 'female' },
  };
}

export function entryToLegacyConfig(entry: CmCharacterEntry): CmCharacterConfig {
  const { id: _id, name: _name, ...config } = entry;
  return config;
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

export function mergeCmCharacterEntry(
  current: CmCharacterEntry,
  patch: Partial<CmCharacterEntry>,
): CmCharacterEntry {
  return {
    ...current,
    ...patch,
    appearance: {
      ...current.appearance,
      ...patch.appearance,
    },
  };
}
