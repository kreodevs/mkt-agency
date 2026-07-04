import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { ApprovalActions } from '@/components/content/ApprovalActions';
import { ContentPlatformBadge } from '@/components/content/ContentPlatformBadge';
import { Button } from '@/components/atoms/Button';
import { Dialog } from '@/components/molecules/Dialog';
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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

interface InboxContentDetailDialogProps {
  item: PublicationInboxItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sohoMode?: boolean;
  showApproval?: boolean;
}

export function InboxContentDetailDialog({
  item,
  open,
  onOpenChange,
  sohoMode = false,
  showApproval = false,
}: InboxContentDetailDialogProps) {
  if (!item) {
    return null;
  }

  const displayBody = sanitizePublishableCopy(item.body);

  return (
    <Dialog
      visible={open}
      onHide={() => onOpenChange(false)}
      title={item.title}
      size="xl"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Link to={`/contents/${item.contentId}`} onClick={() => onOpenChange(false)}>
            <Button type="button" variant="ghost">
              Abrir editor completo
            </Button>
          </Link>
        </div>
      }
    >
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-medium uppercase text-[var(--foreground-muted)]">
            {STATUS_LABELS[item.status] ?? item.status}
          </span>
          <ContentPlatformBadge platform={item.platform} size="sm" />
          <span className="inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatScheduledDate(item.scheduledDate)}
          </span>
          {item.productName && (
            <span className="text-xs text-[var(--foreground-muted)]">{item.productName}</span>
          )}
        </div>

        <InboxItemVisualPreview item={item} />

        <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            Texto completo
          </p>
          <p className="whitespace-pre-wrap text-sm text-[var(--foreground)]">{displayBody}</p>
        </div>

        <InboxQuickPublishActions item={item} />

        {showApproval && item.versionId && !item.signatureHash && (
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
        )}
      </div>
    </Dialog>
  );
}

export default InboxContentDetailDialog;
