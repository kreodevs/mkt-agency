import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Maximize2 } from 'lucide-react';
import { ContentPlatformBadge } from '@/components/content/ContentPlatformBadge';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { InboxContentDetailDialog } from '@/components/publication-inbox/InboxContentDetailDialog';
import { InboxItemVisualPreview } from '@/components/publication-inbox/InboxItemVisualPreview';
import { InboxArtPublishBar } from '@/components/publication-inbox/InboxArtPublishBar';
import { InboxQuickPublishActions } from '@/components/publication-inbox/InboxQuickPublishActions';
import { InboxItemMetadata } from '@/components/publication-inbox/InboxItemMetadata';
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

function statusToPill(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'error';
  if (status === 'in_review' || status === 'in_changes') return 'warning';
  return 'neutral';
}

interface InboxItemCardProps {
  item: PublicationInboxItem;
  isNew?: boolean;
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
  isNew = false,
  selectable = false,
  selected = false,
  onToggleSelect,
  showApproval = false,
  showEditorLink = false,
  sohoMode = false,
  onRejected,
}: InboxItemCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const displayBody = sanitizePublishableCopy(item.body);
  const showBodyClamp = displayBody.length > 320;
  const isRejected = item.status === 'rejected';

  return (
    <article
      className={[
        'rounded-[var(--radius-md)] border p-[var(--spacing-md)] transition-colors',
        isNew
          ? 'border-[var(--brand)]/50 bg-[var(--brand-muted)]/25 hover:border-[var(--brand)]'
          : 'border-[var(--border)] hover:border-[var(--primary)]/40',
      ].join(' ')}
    >
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
            {isNew ? (
              <StatusPill status="warning" size="sm">
                Nuevo
              </StatusPill>
            ) : null}
            <ContentPlatformBadge platform={item.platform} size="sm" />
          </div>

          <div className="mt-1">
            <InboxItemMetadata item={item} />
          </div>

          <InboxItemVisualPreview item={item} />
          <InboxArtPublishBar item={item} />

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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 h-auto px-0 text-xs text-[var(--primary)]"
              onClick={() => setDetailOpen(true)}
            >
              Leer más
            </Button>
          )}

          <div className="mt-[var(--spacing-md)] space-y-[var(--spacing-sm)]">
            {!isRejected && (
              <InboxQuickPublishActions
                item={item}
                showApproval={showApproval}
                hideArtPrimaryActions
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
