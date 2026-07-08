import { apiFetch } from '@/services/api';

export type CmCharacterAppearance = {
  gender?: 'female' | 'male' | 'neutral';
  ageRange?: string;
  style?: string;
  background?: string;
  notes?: string;
};

export type CmCharacterStatus = {
  characterId: string;
  name: string;
  productId: string;
  ready: boolean;
  status: string;
  portraitAssetId: string | null;
  previewVideoAssetId: string | null;
  appearance: CmCharacterAppearance | null;
  voiceId: string | null;
  voiceName: string | null;
  errorMessage: string | null;
  isDefault: boolean;
};

export type CmCharactersLibrary = {
  productId: string;
  defaultCharacterId: string | null;
  readyCount: number;
  characters: CmCharacterStatus[];
};

export type UpdateCmCharacterPayload = CmCharacterAppearance & {
  name?: string;
  voiceId?: string;
  voiceName?: string;
};

export type CmCharacterGenerateResult = {
  characterId: string;
  portraitAssetId?: string;
  previewVideoAssetId?: string;
  status: string;
  message: string;
};

export function listCmCharacters(productId: string): Promise<CmCharactersLibrary> {
  return apiFetch<CmCharactersLibrary>(`/products/${productId}/cm-characters`);
}

export function createCmCharacter(
  productId: string,
  name: string,
): Promise<CmCharacterStatus> {
  return apiFetch<CmCharacterStatus>(`/products/${productId}/cm-characters`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function setDefaultCmCharacter(
  productId: string,
  characterId: string,
): Promise<CmCharacterStatus> {
  return apiFetch<CmCharacterStatus>(`/products/${productId}/cm-characters/default`, {
    method: 'PATCH',
    body: JSON.stringify({ characterId }),
  });
}

export function getCmCharacter(
  productId: string,
  characterId: string,
): Promise<CmCharacterStatus> {
  return apiFetch<CmCharacterStatus>(
    `/products/${productId}/cm-characters/${characterId}`,
  );
}

export function updateCmCharacterAppearance(
  productId: string,
  characterId: string,
  payload: UpdateCmCharacterPayload,
): Promise<CmCharacterStatus> {
  return apiFetch<CmCharacterStatus>(
    `/products/${productId}/cm-characters/${characterId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function deleteCmCharacter(
  productId: string,
  characterId: string,
): Promise<CmCharactersLibrary> {
  return apiFetch<CmCharactersLibrary>(
    `/products/${productId}/cm-characters/${characterId}`,
    { method: 'DELETE' },
  );
}

export function generateCmPortrait(
  productId: string,
  characterId: string,
): Promise<CmCharacterGenerateResult> {
  return apiFetch<CmCharacterGenerateResult>(
    `/products/${productId}/cm-characters/${characterId}/generate-portrait`,
    { method: 'POST' },
  );
}

export function selectCmPortrait(
  productId: string,
  characterId: string,
  assetId: string,
): Promise<CmCharacterGenerateResult> {
  return apiFetch<CmCharacterGenerateResult>(
    `/products/${productId}/cm-characters/${characterId}/select-portrait`,
    {
      method: 'POST',
      body: JSON.stringify({ assetId }),
    },
  );
}

export function generateCmPreview(
  productId: string,
  characterId: string,
): Promise<CmCharacterGenerateResult> {
  return apiFetch<CmCharacterGenerateResult>(
    `/products/${productId}/cm-characters/${characterId}/generate-preview`,
    { method: 'POST' },
  );
}

/** @deprecated Usa listCmCharacters — mantiene compatibilidad con rutas legacy */
export function getCmCharacterStatus(productId: string): Promise<CmCharacterStatus> {
  return apiFetch<CmCharacterStatus>(`/products/${productId}/cm-character`);
}
