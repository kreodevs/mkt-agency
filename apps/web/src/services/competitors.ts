import { apiFetch } from '@/services/api';
import type {
  Competitor,
  MentionSentiment,
  PaginatedMentionsResponse,
} from '@/types/competitors';

export async function listCompetitors(): Promise<{ items: Competitor[] }> {
  return apiFetch<{ items: Competitor[] }>('/competitors');
}

export async function createCompetitor(payload: {
  name: string;
  website?: string;
  industry?: string;
}): Promise<Competitor> {
  return apiFetch<Competitor>('/competitors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteCompetitor(id: string): Promise<void> {
  return apiFetch<void>(`/competitors/${id}`, { method: 'DELETE' });
}

export async function listCompetitorMentions(
  competitorId: string,
  params: { sentiment?: MentionSentiment; page?: number; limit?: number } = {},
): Promise<PaginatedMentionsResponse> {
  const search = new URLSearchParams();
  if (params.sentiment) search.set('sentiment', params.sentiment);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch<PaginatedMentionsResponse>(
    `/competitors/${competitorId}/mentions${qs ? `?${qs}` : ''}`,
  );
}
