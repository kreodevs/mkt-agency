import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { ApprovalActions } from '@/components/content/ApprovalActions';
import { ContentPlatformBadge } from '@/components/content/ContentPlatformBadge';
import { StatusPill } from '@/components/atoms/StatusPill';
import { Button } from '@/components/atoms/Button';
import { Dialog } from '@/components/molecules/Dialog';
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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function statusToPill(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'error';
  if (status === 'in_review' || status === 'in_changes') return 'warning';
  return 'neutral';
}

interface InboxContentDetailDialogProps {
  item: PublicationInboxItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sohoMode?: boolean;
  showApproval?: boolean;
  onRejected?: (context: InboxRejectFollowUpContext) => void;
}

export function InboxContentDetailDialog({
  item,
  open,
  onOpenChange,
  sohoMode = false,
  showApproval = false,
  onRejected,
}: InboxContentDetailDialogProps) {
  if (!item) {
    return null;
  }

  const displayBody = sanitizePublishableCopy(item.body);
  const isRejected = item.status === 'rejected';
  const showFormalApproval =
    showApproval && !isRejected && item.versionId && !item.signatureHash;

  return (
    <Dialog
      visible={open}
      onHide={() => onOpenChange(false)}
      title={item.title}
      size="full"
      footer={
        <div className="sticky bottom-0 -mx-[var(--spacing-md)] border-t border-[var(--border)] bg-[var(--card)] px-[var(--spacing-md)] py-[var(--spacing-sm)] sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
          <div className="flex flex-col gap-[var(--spacing-sm)] sm:flex-row sm:flex-wrap sm:justify-end">
            <InboxQuickPublishActions
              item={item}
              showApproval={false}
              showRegenerate={!isRejected}
              onRejected={onRejected}
              onDeleted={() => onOpenChange(false)}
              layout="footer"
            />
            <div className="flex flex-wrap justify-end gap-[var(--spacing-sm)]">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              {!sohoMode ? (
                <Link to={`/contents/${item.contentId}`} onClick={() => onOpenChange(false)}>
                  <Button type="button" variant="ghost">
                    Abrir editor completo
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-[var(--spacing-md)]">
        <div className="flex flex-wrap items-center gap-[var(--spacing-sm)]">
          <StatusPill status={statusToPill(item.status)} size="sm">
            {STATUS_LABELS[item.status] ?? item.status}
          </StatusPill>
          <ContentPlatformBadge platform={item.platform} size="sm" />
          <span className="inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatScheduledDate(item.scheduledDate)}
          </span>
          {item.productName && (
            <span className="text-xs text-[var(--foreground-muted)]">{item.productName}</span>
          )}
        </div>

        <InboxItemVisualPreview item={item} variant="detail" />

        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-secondary)] p-[var(--spacing-md)]">
          <p className="mb-[var(--spacing-sm)] text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            Texto completo
          </p>
          <p className="whitespace-pre-wrap text-sm text-[var(--foreground)]">{displayBody}</p>
        </div>

        {isRejected ? (
          <RejectedInboxActions item={item} />
        ) : showFormalApproval ? (
          <ApprovalActions
            contentId={item.contentId}
            version={{
              id: item.versionId!,
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
            visualFormat={item.visualFormat}
            onRejected={onRejected}
          />
        ) : null}
      </div>
    </Dialog>
  );
}

export default InboxContentDetailDialog;
