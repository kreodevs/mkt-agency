import { useQuery } from '@tanstack/react-query';
import { StatusPill } from '@/components/atoms/StatusPill';
import { Card } from '@/components/molecules/Card';
import { listCompetitorMentions } from '@/services/competitors';
import {
  SENTIMENT_LABELS,
  sentimentVariant,
  type MentionSentiment,
} from '@/types/competitors';

const filterSelectClass =
  'h-9 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-2 text-sm text-[var(--foreground)]';

interface MentionListProps {
  competitorId: string;
  sentimentFilter: '' | MentionSentiment;
}

export function MentionList({ competitorId, sentimentFilter }: MentionListProps) {
  const mentionsQuery = useQuery({
    queryKey: ['competitor-mentions', competitorId, sentimentFilter],
    queryFn: () =>
      listCompetitorMentions(competitorId, {
        limit: 20,
        sentiment: sentimentFilter || undefined,
      }),
  });

  const items = mentionsQuery.data?.items ?? [];

  if (mentionsQuery.isLoading) {
    return <p className="text-sm text-[var(--foreground-muted)]">Cargando menciones…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--foreground-muted)]">
        Sin menciones para este filtro.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((mention) => (
        <li key={mention.id}>
          <Card className="space-y-2 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-[var(--foreground)]">
                {mention.source ?? 'Fuente desconocida'}
              </span>
              {mention.sentiment ? (
                <StatusPill status={sentimentVariant(mention.sentiment)} size="sm">
                  {SENTIMENT_LABELS[mention.sentiment]}
                </StatusPill>
              ) : null}
              {mention.mentionedAt ? (
                <span className="text-xs text-[var(--foreground-muted)]">
                  {new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(
                    new Date(mention.mentionedAt),
                  )}
                </span>
              ) : null}
            </div>
            {mention.content ? (
              <p className="text-[var(--foreground-muted)]">{mention.content}</p>
            ) : null}
          </Card>
        </li>
      ))}
    </ul>
  );
}

export { filterSelectClass };
