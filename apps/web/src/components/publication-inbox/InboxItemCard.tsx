import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Copy, Maximize2 } from 'lucide-react';
import { ApprovalActions } from '@/components/content/ApprovalActions';
import { ContentPlatformBadge } from '@/components/content/ContentPlatformBadge';
import { Button } from '@/components/atoms/Button';
import { InboxContentDetailDialog } from '@/components/publication-inbox/InboxContentDetailDialog';
import { InboxItemVisualPreview } from '@/components/publication-inbox/InboxItemVisualPreview';
import { InboxQuickPublishActions } from '@/components/publication-inbox/InboxQuickPublishActions';
import { sanitizePublishableCopy } from '@/lib/sanitize-publishable-copy';
import type { PublicationInboxItem } from '@/types/publication-inbox';

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

interface InboxItemCardProps {
  item: PublicationInboxItem;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (contentId: string) => void;
  showApproval?: boolean;
  primaryAction?: 'copy' | 'edit';
  sohoMode?: boolean;
}

export function InboxItemCard({
  item,
  selectable = false,
  selected = false,
  onToggleSelect,
  showApproval = false,
  primaryAction = 'copy',
  sohoMode = false,
}: InboxItemCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const formattedDate = formatScheduledDate(item.scheduledDate);
  const displayBody = sanitizePublishableCopy(item.body);
  const showBodyClamp = displayBody.length > 320;

  return (
    <article className="rounded-xl border border-[var(--border)] p-4 transition-colors hover:border-[var(--primary)]/40">
      <div className="flex items-start gap-3">
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
            <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-medium uppercase text-[var(--foreground-muted)]">
              {STATUS_LABELS[item.status] ?? item.status}
            </span>
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

          {sohoMode ? (
            <div className="mt-3 space-y-2">
              <InboxQuickPublishActions item={item} />
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
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {primaryAction === 'copy' ? (
                <Link
                  to={`/contents/${item.contentId}`}
                  className="inline-flex items-center gap-1 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-90"
                >
                  <Copy className="h-3 w-3" />
                  Copiar y publicar
                </Link>
              ) : (
                <Link
                  to={`/contents/${item.contentId}`}
                  className="text-xs font-medium text-[var(--primary)] hover:underline"
                >
                  Editar contenido
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
          )}

          <InboxContentDetailDialog
            item={item}
            open={detailOpen}
            onOpenChange={setDetailOpen}
            sohoMode={sohoMode}
            showApproval={showApproval}
          />

          {showApproval && item.versionId && !item.signatureHash && (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <ApprovalActions
                contentId={item.contentId}
                version={{
                  id: item.versionId,
                  versionNumber: item.versionNumber ?? 1,
                  title: item.title,
                  body: item.body,
                  signatureHash: item.signatureHash,
                  signedAt: null,
                  authorId: '',
                  assets: item.assets,
                  reason: null,
                  changeSummary: null,
                  createdAt: '',
                }}
                sohoMode={sohoMode}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default InboxItemCard;
