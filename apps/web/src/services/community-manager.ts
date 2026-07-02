import { apiFetch } from '@/services/api';

export type CmPlatform = 'instagram' | 'linkedin' | 'twitter' | 'facebook' | 'tiktok';

export interface CommunityManagerPreferences {
  platforms: CmPlatform[];
  count: number;
}

export interface CommunityManagerReadinessItem {
  key: string;
  label: string;
  description: string;
  complete: boolean;
  href: string;
}

export interface CommunityManagerReadiness {
  completed: number;
  total: number;
  items: CommunityManagerReadinessItem[];
}

export async function getCommunityManagerPreferences(): Promise<CommunityManagerPreferences> {
  return apiFetch<CommunityManagerPreferences>('/community-manager/preferences');
}

export async function saveCommunityManagerPreferences(
  payload: CommunityManagerPreferences,
): Promise<CommunityManagerPreferences> {
  return apiFetch<CommunityManagerPreferences>('/community-manager/preferences', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getCommunityManagerReadiness(): Promise<CommunityManagerReadiness> {
  return apiFetch<CommunityManagerReadiness>('/community-manager/readiness');
}

export interface GenerateSocialCopyPayload {
  platforms: CmPlatform[];
  count: number;
  campaignId?: string;
  productId?: string;
  tone?: string;
  topics?: string[];
}

export interface GenerateSocialCopyResponse {
  id: string;
  status: 'completed' | 'failed';
  postsGenerated: number;
  imagesAttached?: number;
  error?: string;
}

export async function generateSocialCopy(
  payload: GenerateSocialCopyPayload,
): Promise<GenerateSocialCopyResponse> {
  return apiFetch<GenerateSocialCopyResponse>('/community-manager/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
