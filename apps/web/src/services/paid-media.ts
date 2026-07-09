import { apiFetch } from '@/services/api';

export interface MediaCampaignIntent {
  id: string;
  planId: string | null;
  creativePackId: string | null;
  productId: string | null;
  platform: string;
  name: string;
  structure: Record<string, unknown>;
  dailyBudget: number | null;
  totalBudget: number | null;
  status: string;
  requiresApproval: boolean;
  approvedAt: string | null;
  launchedAt: string | null;
  createdAt: string;
}

export async function listMediaIntents(): Promise<MediaCampaignIntent[]> {
  return apiFetch<MediaCampaignIntent[]>('/agency/media-intents');
}

export async function approveMediaIntent(id: string): Promise<MediaCampaignIntent> {
  return apiFetch<MediaCampaignIntent>(`/agency/media-intents/${id}/approve`, {
    method: 'POST',
  });
}

export async function launchMediaIntentManual(id: string): Promise<MediaCampaignIntent> {
  return apiFetch<MediaCampaignIntent>(`/agency/media-intents/${id}/launch-manual`, {
    method: 'POST',
  });
}
