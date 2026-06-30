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
