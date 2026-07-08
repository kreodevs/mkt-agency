import { apiFetch } from '@/services/api';

export type CmCharacterAppearance = {
  gender?: 'female' | 'male' | 'neutral';
  ageRange?: string;
  style?: string;
  background?: string;
  notes?: string;
};

export type CmCharacterStatus = {
  productId: string;
  ready: boolean;
  status: string;
  portraitAssetId: string | null;
  previewVideoAssetId: string | null;
  appearance: CmCharacterAppearance | null;
  voiceId: string | null;
  voiceName: string | null;
  errorMessage: string | null;
};

export type UpdateCmCharacterPayload = CmCharacterAppearance & {
  voiceId?: string;
  voiceName?: string;
};

export type CmCharacterGenerateResult = {
  portraitAssetId?: string;
  previewVideoAssetId?: string;
  status: string;
  message: string;
};

export function getCmCharacterStatus(productId: string): Promise<CmCharacterStatus> {
  return apiFetch<CmCharacterStatus>(`/products/${productId}/cm-character`);
}

export function updateCmCharacterAppearance(
  productId: string,
  payload: UpdateCmCharacterPayload,
): Promise<CmCharacterStatus> {
  return apiFetch<CmCharacterStatus>(`/products/${productId}/cm-character`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function generateCmPortrait(productId: string): Promise<CmCharacterGenerateResult> {
  return apiFetch<CmCharacterGenerateResult>(`/products/${productId}/cm-character/generate-portrait`, {
    method: 'POST',
  });
}

export function generateCmPreview(productId: string): Promise<CmCharacterGenerateResult> {
  return apiFetch<CmCharacterGenerateResult>(`/products/${productId}/cm-character/generate-preview`, {
    method: 'POST',
  });
}
