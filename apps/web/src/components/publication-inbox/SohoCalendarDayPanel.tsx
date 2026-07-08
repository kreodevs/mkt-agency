import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { InboxItemCard } from '@/components/publication-inbox/InboxItemCard';
import {
  InboxRejectFollowUpDialog,
  type InboxRejectFollowUpContext,
} from '@/components/publication-inbox/InboxRejectFollowUpDialog';
import { getPublicationInbox } from '@/services/publication-inbox';
import { useCalendarDay } from '@/hooks/useCalendar';
import type { PublicationInboxItem } from '@/types/publication-inbox';

function formatDayLabel(date: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00`));
}

function isSameDay(item: PublicationInboxItem, date: string): boolean {
  return item.scheduledDate.slice(0, 10) === date;
}

function needsApproval(item: PublicationInboxItem): boolean {
  return Boolean(item.versionId && !item.signatureHash && item.status !== 'rejected');
}

function sortByPublishPriority(items: PublicationInboxItem[]): PublicationInboxItem[] {
  const score = (item: PublicationInboxItem) => {
    if (needsApproval(item)) return 0;
    if (item.status === 'approved' && item.signatureHash) return 1;
    if (item.status === 'rejected') return 3;
    return 2;
  };
  return [...items].sort((a, b) => score(a) - score(b));
}

type SohoCalendarDayPanelProps = {
  date: string;
  productId?: string;
  onClose?: () => void;
};

export function SohoCalendarDayPanel({ date, productId, onClose }: SohoCalendarDayPanelProps) {
  const [rejectFollowUp, setRejectFollowUp] = useState<InboxRejectFollowUpContext | null>(null);

  const inboxQuery = useQuery({
    queryKey: ['publication-inbox', productId],
    queryFn: () => getPublicationInbox(productId),
  });

  const dayQuery = useCalendarDay(date, productId);

  const inboxItems = useMemo(() => {
    if (!inboxQuery.data) return [];
    const all = [
      ...inboxQuery.data.readyToPublish,
      ...inboxQuery.data.pendingApproval,
      ...inboxQuery.data.upcoming,
      ...inboxQuery.data.rejected,
    ];
    return sortByPublishPriority(all.filter((item) => isSameDay(item, date)));
  }, [inboxQuery.data, date]);

  const extraCalendarItems = useMemo(() => {
    const inboxIds = new Set(inboxItems.map((item) => item.contentId));
    return (dayQuery.data?.items ?? []).filter((item) => !inboxIds.has(item.contentId));
  }, [dayQuery.data?.items, inboxItems]);

  const pendingCount = inboxItems.filter(needsApproval).length;
  const loading = inboxQuery.isLoading || dayQuery.isLoading;

  return (
    <>
      <Card>
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Publicaciones del día</h3>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{formatDayLabel(date)}</p>
            {pendingCount > 0 && (
              <p className="mt-1 text-xs font-medium text-[var(--warning)]">
                {pendingCount} pendiente(s) de aprobar — usa los botones en cada tarjeta
              </p>
            )}
          </div>
          {onClose && (
            <Button type="button" size="sm" variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </div>

        {loading && (
          <p className="text-sm text-[var(--foreground-muted)]">Cargando publicaciones...</p>
        )}

        {!loading && inboxItems.length === 0 && extraCalendarItems.length === 0 && (
          <p className="text-sm text-[var(--foreground-muted)]">
            No hay publicaciones programadas para este día.
          </p>
        )}

        {!loading && inboxItems.length > 0 && (
          <div className="space-y-4">
            {inboxItems.map((item) => (
              <InboxItemCard
                key={item.contentId}
                item={item}
                showApproval={needsApproval(item)}
                primaryAction="copy"
                sohoMode
                onRejected={setRejectFollowUp}
              />
            ))}
          </div>
        )}

        {!loading && extraCalendarItems.length > 0 && (
          <ul
            className={`space-y-3 ${inboxItems.length > 0 ? 'mt-4 border-t border-[var(--border)] pt-4' : ''}`}
          >
            {extraCalendarItems.map((item) => (
              <li
                key={item.contentId}
                className="rounded-[var(--radius-md)] border border-[var(--border)] p-3 text-sm"
              >
                <p className="font-medium text-[var(--foreground)]">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-[var(--foreground-muted)]">{item.preview}</p>
                <Link
                  to={`/contents/${item.contentId}`}
                  className="mt-2 inline-block text-xs font-medium text-[var(--primary)] hover:underline"
                >
                  Abrir publicación
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <InboxRejectFollowUpDialog
        context={rejectFollowUp}
        onClose={() => setRejectFollowUp(null)}
      />
    </>
  );
}

export default SohoCalendarDayPanel;
