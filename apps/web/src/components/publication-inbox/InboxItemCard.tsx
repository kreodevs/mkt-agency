import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Maximize2 } from 'lucide-react';
import { ContentPlatformBadge } from '@/components/content/ContentPlatformBadge';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { InboxContentDetailDialog } from '@/components/publication-inbox/InboxContentDetailDialog';
import { InboxItemVisualPreview } from '@/components/publication-inbox/InboxItemVisualPreview';
import { InboxQuickPublishActions } from '@/components/publication-inbox/InboxQuickPublishActions';
import { RejectedInboxActions } from '@/components/publication-inbox/RejectedInboxActions';
import { sanitizePublishableCopy } from '@/lib/sanitize-publishable-copy';
import type { PublicationInboxItem } from '@/types/publication-inbox';
import type { InboxRejectFollowUpContext } from '@/components/publication-inbox/InboxRejectFollowUpDialog';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  in_review: 'En revisión',
  in_changes: 'En cambios',
};

function formatScheduledDate(dateKey: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(dateKey);
  if (!match) {
    return 'Sin fecha';
  }
  return new Date(`${match[1]}T12:00:00`).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function statusToPill(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'error';
  if (status === 'in_review' || status === 'in_changes') return 'warning';
  return 'neutral';
}

interface InboxItemCardProps {
  item: PublicationInboxItem;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (contentId: string) => void;
  showApproval?: boolean;
  showEditorLink?: boolean;
  sohoMode?: boolean;
  onRejected?: (context: InboxRejectFollowUpContext) => void;
}

export function InboxItemCard({
  item,
  selectable = false,
  selected = false,
  onToggleSelect,
  showApproval = false,
  showEditorLink = false,
  sohoMode = false,
  onRejected,
}: InboxItemCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const formattedDate = formatScheduledDate(item.scheduledDate);
  const displayBody = sanitizePublishableCopy(item.body);
  const showBodyClamp = displayBody.length > 320;
  const isRejected = item.status === 'rejected';

  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)] transition-colors hover:border-[var(--primary)]/40">
      <div className="flex items-start gap-[var(--spacing-md)]">
        {selectable && (
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-[var(--border)]"
            checked={selected}
            onChange={() => onToggleSelect?.(item.contentId)}
            aria-label={`Seleccionar ${item.title}`}
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-2 text-sm font-semibold text-[var(--foreground)]">{item.title}</h3>
            <StatusPill status={statusToPill(item.status)} size="sm">
              {STATUS_LABELS[item.status] ?? item.status}
            </StatusPill>
            <ContentPlatformBadge platform={item.platform} size="sm" />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)]">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formattedDate}
            </span>
            {item.productName && <span>{item.productName}</span>}
            {item.type && <span className="uppercase">{item.type}</span>}
          </div>

          <InboxItemVisualPreview item={item} />

          <p
            className={[
              'mt-2 whitespace-pre-wrap text-sm text-[var(--foreground-muted)]',
              showBodyClamp ? 'line-clamp-5' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {displayBody}
          </p>

          {showBodyClamp && (
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              Texto recortado en la tarjeta.
            </p>
          )}

          <div className="mt-[var(--spacing-md)] space-y-[var(--spacing-sm)]">
            {!isRejected && (
              <InboxQuickPublishActions
                item={item}
                showApproval={showApproval}
                onRejected={onRejected}
              />
            )}
            {showEditorLink && !isRejected && (
              <Link to={`/contents/${item.contentId}`}>
                <Button type="button" size="sm" variant="ghost">
                  Editar en detalle
                </Button>
              </Link>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setDetailOpen(true)}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Ver ficha completa
            </Button>
          </div>

          <InboxContentDetailDialog
            item={item}
            open={detailOpen}
            onOpenChange={setDetailOpen}
            sohoMode={sohoMode}
            showApproval={showApproval && !isRejected}
            onRejected={onRejected}
          />

          {isRejected ? (
            <RejectedInboxActions item={item} />
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default InboxItemCard;
