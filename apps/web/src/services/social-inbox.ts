import { apiFetch } from '@/services/api';

export interface SocialInteraction {
  id: string;
  productId: string | null;
  platform: string;
  channel: string;
  authorHandle: string | null;
  message: string;
  intent: string;
  sentiment: string | null;
  status: string;
  leadId: string | null;
  suggestedReply: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSocialInteractions {
  items: SocialInteraction[];
  total: number;
  page: number;
  limit: number;
}

export interface IngestSocialInteractionPayload {
  message: string;
  productId?: string;
  platform?: string;
  channel?: string;
  authorHandle?: string;
  contactEmail?: string;
  contactName?: string;
  contactPhone?: string;
}

export async function listSocialInteractions(params?: {
  status?: string;
  intent?: string;
}): Promise<PaginatedSocialInteractions> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.intent) search.set('intent', params.intent);
  const q = search.toString();
  return apiFetch<PaginatedSocialInteractions>(`/social-inbox${q ? `?${q}` : ''}`);
}

export async function ingestSocialInteraction(
  payload: IngestSocialInteractionPayload,
): Promise<SocialInteraction> {
  return apiFetch<SocialInteraction>('/social-inbox/ingest', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function markSocialInteractionReplied(id: string): Promise<SocialInteraction> {
  return apiFetch<SocialInteraction>(`/social-inbox/${id}/replied`, { method: 'PATCH' });
}
