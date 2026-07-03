import { apiFetch, ApiError } from '@/services/api';
import type {
  BulkCreateCompetitorsResponse,
  Competitor,
  CompetitorDiscoveryScope,
  DiscoverCompetitorsJobStatus,
  DiscoverCompetitorsResponse,
  MentionSentiment,
  PaginatedMentionsResponse,
} from '@/types/competitors';

const DISCOVERY_POLL_INTERVAL_MS = 3000;
const DISCOVERY_POLL_MAX_ATTEMPTS = 60;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export async function getDiscoverCompetitorsJob(
  jobId: string,
): Promise<DiscoverCompetitorsJobStatus> {
  return apiFetch<DiscoverCompetitorsJobStatus>(`/competitors/discover/jobs/${jobId}`);
}

export async function discoverCompetitors(payload: {
  scope: CompetitorDiscoveryScope;
  country?: string;
  city?: string;
  productId?: string;
}): Promise<DiscoverCompetitorsResponse> {
  const started = await apiFetch<{ jobId: string; status: 'processing' }>('/competitors/discover', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  for (let attempt = 0; attempt < DISCOVERY_POLL_MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await sleep(DISCOVERY_POLL_INTERVAL_MS);
    }

    const status = await getDiscoverCompetitorsJob(started.jobId);
    if (status.status === 'completed' && status.result) {
      return status.result;
    }
    if (status.status === 'failed') {
      throw new ApiError(status.error ?? 'No se pudo buscar competidores', 500);
    }
  }

  throw new ApiError(
    'La búsqueda sigue en proceso. Espera unos segundos e intenta de nuevo.',
    504,
  );
}

export async function bulkCreateCompetitors(
  items: Array<{ name: string; website?: string; industry?: string }>,
): Promise<BulkCreateCompetitorsResponse> {
  return apiFetch<BulkCreateCompetitorsResponse>('/competitors/bulk', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
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
