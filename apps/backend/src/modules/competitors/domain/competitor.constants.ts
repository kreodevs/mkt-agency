export type MentionSentiment = 'positive' | 'negative' | 'neutral';

export const MENTION_SENTIMENTS: MentionSentiment[] = ['positive', 'negative', 'neutral'];

export const SENTIMENT_LABELS: Record<MentionSentiment, string> = {
  positive: 'Positivo',
  negative: 'Negativo',
  neutral: 'Neutral',
};
