import { Check, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { useInboxPublishActions } from '@/hooks/useInboxPublishActions';
import type { PublicationInboxItem } from '@/types/publication-inbox';

interface InboxArtPublishBarProps {
  item: PublicationInboxItem;
}

export function InboxArtPublishBar({ item }: InboxArtPublishBarProps) {
  const {
    publishN8nMutation,
    markPublishedMutation,
    canPublishWithN8n,
    canMarkPublishedManually,
    isPublished,
    isApproved,
  } = useInboxPublishActions(item);

  if (!isApproved) {
    return null;
  }

  if (isPublished) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--success)]/30 bg-[var(--success)]/5 px-3 py-2 text-sm text-[var(--success)]">
        <Check className="h-4 w-4 shrink-0" />
        <span>Publicado</span>
      </div>
    );
  }

  if (!canPublishWithN8n) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-muted)]">
        <span>Listo para copiar y pegar manualmente.</span>
        {item.productId ? (
          <Link
            to={`/products/${item.productId}#publicacion-n8n`}
            className="text-[var(--primary)] underline-offset-2 hover:underline"
          >
            Activar n8n en el producto
          </Link>
        ) : null}
      </div>
    );
  }

  return (
      <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--primary)]/25 bg-[var(--primary)]/5 p-3">
        <p className="mb-2 text-xs text-[var(--foreground-muted)]">
          Este arte está listo — envíalo a n8n para publicar en {item.platform ?? 'tu red'}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="min-h-11 sm:min-h-0"
            loading={publishN8nMutation.isPending}
            onClick={() => publishN8nMutation.mutate()}
          >
            <Send className="mr-1.5 h-4 w-4" />
            Publicar este arte con n8n
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 sm:min-h-0"
            loading={markPublishedMutation.isPending}
            onClick={() => markPublishedMutation.mutate()}
          >
            Ya lo publiqué
          </Button>
        </div>
      </div>
    );
}

export default InboxArtPublishBar;
