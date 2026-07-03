export type MentionSentiment = 'positive' | 'negative' | 'neutral';

export type CompetitorDiscoveryScope = 'global' | 'country' | 'city';

export interface DiscoveredCompetitor {
  name: string;
  website: string | null;
  industry: string | null;
  rationale: string | null;
}

export interface DiscoverCompetitorsResponse {
  scope: CompetitorDiscoveryScope;
  country: string | null;
  city: string | null;
  items: DiscoveredCompetitor[];
}

export interface DiscoverCompetitorsJobStarted {
  jobId: string;
  status: 'processing';
}

export interface DiscoverCompetitorsJobStatus {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  result?: DiscoverCompetitorsResponse;
  error?: string;
}

export interface BulkCreateCompetitorsResponse {
  created: Competitor[];
  skipped: number;
}

export interface Competitor {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitorMention {
  id: string;
  competitorId: string;
  source: string | null;
  content: string | null;
  sentiment: MentionSentiment | null;
  mentionedAt: string | null;
  createdAt: string;
}

export interface PaginatedMentionsResponse {
  items: CompetitorMention[];
  total: number;
  page: number;
  limit: number;
}

export const SENTIMENT_LABELS: Record<MentionSentiment, string> = {
  positive: 'Positivo',
  negative: 'Negativo',
  neutral: 'Neutral',
};

export function sentimentVariant(
  sentiment: MentionSentiment | null,
): 'success' | 'warning' | 'error' | 'neutral' {
  if (sentiment === 'positive') return 'success';
  if (sentiment === 'negative') return 'error';
  if (sentiment === 'neutral') return 'warning';
  return 'neutral';
}
