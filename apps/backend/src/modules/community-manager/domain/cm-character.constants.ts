export const CM_CHARACTER_METADATA_KEY = 'cmCharacter';

export type CmCharacterStatus =
  | 'pending'
  | 'generating_portrait'
  | 'generating_preview'
  | 'ready'
  | 'failed';

export interface CmCharacterAppearance {
  gender?: 'female' | 'male' | 'neutral';
  ageRange?: string;
  style?: string;
  background?: string;
  notes?: string;
}

export interface CmCharacterConfig {
  appearance?: CmCharacterAppearance;
  voiceId?: string;
  voiceName?: string;
  portraitAssetId?: string | null;
  previewVideoAssetId?: string | null;
  readyAt?: string | null;
  status?: CmCharacterStatus;
  errorMessage?: string | null;
}

/** Voz ElevenLabs multilingüe con buen español (Matilda). */
export const DEFAULT_CM_VOICE_ID = 'XrExE9yKIg1WjnnlVkGX';
export const DEFAULT_CM_VOICE_NAME = 'Matilda';

/** Voz Kokoro (OpenRouter fallback) para español. */
export const DEFAULT_KOKORO_SPANISH_VOICE = 'ef_dora';

export const CM_PORTRAIT_SIZE = '1080x1920';

export const CM_PREVIEW_SCRIPT =
  'Hola, soy tu community manager virtual. Estoy lista para presentar tu marca con claridad y cercanía en redes sociales.';
