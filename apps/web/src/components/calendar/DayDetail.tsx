import { Link } from 'react-router-dom';
import { StatusPill } from '@/components/atoms/StatusPill';
import { ApprovalActions } from '@/components/content/ApprovalActions';
import { SignatureBadge } from '@/components/content/SignatureBadge';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { calendarStatusColor, calendarStatusLabel } from '@/lib/calendar-status';
import type { CalendarDayItem } from '@/types/calendar';
import type { ContentStatus, ContentVersion } from '@/types/content';

interface DayDetailProps {
  date: string;
  items: CalendarDayItem[];
  loading?: boolean;
  onClose?: () => void;
}

function statusVariant(status: ContentStatus) {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'error';
  if (status === 'in_review') return 'info';
  if (status === 'in_changes') return 'warning';
  return 'neutral';
}

function toVersion(item: CalendarDayItem): ContentVersion | null {
  if (!item.versionId) return null;

  return {
    id: item.versionId,
    versionNumber: item.versionNumber ?? 0,
    authorId: '',
    title: item.title,
    body: item.preview,
    assets: [],
    reason: null,
    changeSummary: null,
    signatureHash: item.signatureHash,
    signedAt: null,
    createdAt: item.scheduledDate,
  };
}

export function DayDetail({ date, items, loading, onClose }: DayDetailProps) {
  const formatted = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Detalle del día</h3>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">{formatted}</p>
        </div>
        {onClose && (
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        )}
      </div>
      {loading && (
        <p className="text-sm text-[var(--foreground-muted)]">Cargando piezas...</p>
      )}

      {!loading && items.length === 0 && (
        <p className="text-sm text-[var(--foreground-muted)]">
          No hay contenidos programados para este día.
        </p>
      )}

      <ul className="space-y-4">
        {items.map((item) => {
          const version = toVersion(item);
          return (
            <li
              key={item.contentId}
              className="rounded-lg border border-[var(--border)] p-4"
              style={{ borderLeftWidth: 4, borderLeftColor: calendarStatusColor(item.status) }}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-[var(--foreground)]">{item.title}</h3>
                <StatusPill status={statusVariant(item.status)} size="sm">
                  {calendarStatusLabel(item.status)}
                </StatusPill>
                <span className="text-xs uppercase text-[var(--foreground-muted)]">
                  {item.type}
                </span>
              </div>

              {item.campaignName && (
                <p className="mb-2 text-xs text-[var(--foreground-muted)]">
                  Campaña: {item.campaignName}
                </p>
              )}

              <p className="mb-3 whitespace-pre-wrap text-sm text-[var(--foreground-muted)]">
                {item.preview}
              </p>

              {item.signatureHash && (
                <div className="mb-3">
                  <SignatureBadge signatureHash={item.signatureHash} signedAt={item.scheduledDate} />
                </div>
              )}

              <div className="mb-3 flex flex-wrap gap-2">
                <Link to={`/contents/${item.contentId}`}>
                  <Button type="button" size="sm" variant="outline">
                    Abrir editor
                  </Button>
                </Link>
              </div>

              {version && !version.signatureHash && (
                <ApprovalActions contentId={item.contentId} version={version} />
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default DayDetail;
