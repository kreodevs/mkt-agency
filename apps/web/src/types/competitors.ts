export type MentionSentiment = 'positive' | 'negative' | 'neutral';

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
