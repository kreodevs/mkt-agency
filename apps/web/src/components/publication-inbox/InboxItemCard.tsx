import { Link } from 'react-router-dom';
import { CalendarDays, Copy, ExternalLink } from 'lucide-react';
import { ApprovalActions } from '@/components/content/ApprovalActions';
import type { PublicationInboxItem } from '@/types/publication-inbox';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  in_review: 'En revisión',
  in_changes: 'En cambios',
};

interface InboxItemCardProps {
  item: PublicationInboxItem;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (contentId: string) => void;
  showApproval?: boolean;
  /** CTA principal: copiar/publicar (SOHO) o editar (avanzado). */
  primaryAction?: 'copy' | 'edit';
}

export function InboxItemCard({
  item,
  selectable = false,
  selected = false,
  onToggleSelect,
  showApproval = false,
  primaryAction = 'copy',
}: InboxItemCardProps) {
  const formattedDate = new Date(`${item.scheduledDate}T12:00:00`).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

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
            <h3 className="truncate text-sm font-semibold text-[var(--foreground)]">{item.title}</h3>
            <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-medium uppercase text-[var(--foreground-muted)]">
              {STATUS_LABELS[item.status] ?? item.status}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)]">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formattedDate}
            </span>
            {item.productName && <span>{item.productName}</span>}
            {item.type && <span className="uppercase">{item.type}</span>}
          </div>

          <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--foreground-muted)]">
            {item.preview}
          </p>

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
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
              >
                Editar
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
            {primaryAction === 'copy' && (
              <Link
                to={`/contents/${item.contentId}`}
                className="inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)] hover:text-[var(--primary)]"
              >
                Editar
              </Link>
            )}
          </div>

          {showApproval && item.versionId && !item.signatureHash && (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <ApprovalActions
                contentId={item.contentId}
                version={{
                  id: item.versionId,
                  versionNumber: item.versionNumber ?? 1,
                  title: item.title,
                  body: item.preview,
                  signatureHash: item.signatureHash,
                  signedAt: null,
                  authorId: '',
                  assets: [],
                  reason: null,
                  changeSummary: null,
                  createdAt: '',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default InboxItemCard;
