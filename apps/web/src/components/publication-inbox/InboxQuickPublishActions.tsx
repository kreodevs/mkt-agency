import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  X,
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import {
  buildPostCopyText,
  buildWhatsAppShareUrl,
  getPlatformPublishUrl,
} from '@/lib/content-platform';
import { buildCapturePageUrl } from '@/lib/capture-attribution';
import { sanitizePublishableCopy } from '@/lib/sanitize-publishable-copy';
import { ensureCaptureForm } from '@/services/forms';
import { approveContentVersion, rejectContentVersion } from '@/services/content';
import { regenerateInboxContent } from '@/services/publication-inbox';
import { ApiError } from '@/services/api';
import type { PublicationInboxItem } from '@/types/publication-inbox';
import type { InboxRejectFollowUpContext } from '@/components/publication-inbox/InboxRejectFollowUpDialog';

interface InboxQuickPublishActionsProps {
  item: PublicationInboxItem;
  showRegenerate?: boolean;
  showApproval?: boolean;
  onRejected?: (context: InboxRejectFollowUpContext) => void;
  layout?: 'default' | 'footer';
}

function needsApproval(item: PublicationInboxItem): boolean {
  return Boolean(item.versionId && !item.signatureHash && item.status !== 'rejected');
}

const primaryButtonClass = 'min-h-11 sm:min-h-0';

export function InboxQuickPublishActions({
  item,
  showRegenerate = true,
  showApproval = false,
  onRejected,
  layout = 'default',
}: InboxQuickPublishActionsProps) {
  const queryClient = useQueryClient();
  const [moreOpen, setMoreOpen] = useState(false);
  const canApprove = showApproval && needsApproval(item);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
    void queryClient.invalidateQueries({ queryKey: ['calendar'] });
    void queryClient.invalidateQueries({ queryKey: ['calendar-day'] });
    void queryClient.invalidateQueries({
      queryKey: ['image-generation-by-content', item.contentId],
    });
    void queryClient.invalidateQueries({ queryKey: ['content', item.contentId] });
  };

  const approveMutation = useMutation({
    mutationFn: () => approveContentVersion(item.contentId, item.versionId!),
    onSuccess: () => {
      invalidate();
      toast.success('Publicación aprobada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo aprobar');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectContentVersion(item.contentId, item.versionId!),
    onSuccess: () => {
      invalidate();
      if (onRejected) {
        onRejected({
          contentId: item.contentId,
          title: item.title,
          visualFormat: item.visualFormat,
        });
      } else {
        toast.message('Versión rechazada');
      }
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo rechazar');
    },
  });

  const approvalBusy = approveMutation.isPending || rejectMutation.isPending;

  const captureFormQuery = useQuery({
    queryKey: ['capture-form', item.productId],
    queryFn: () => ensureCaptureForm(item.productId ?? undefined),
    staleTime: 5 * 60 * 1000,
  });

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateInboxContent(item.contentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
      await queryClient.invalidateQueries({
        queryKey: ['image-generation-by-content', item.contentId],
      });
      toast.success('Nueva versión en camino — texto actualizado e imagen regenerándose');
    },
    onError: () => toast.error('No se pudo regenerar'),
  });

  const copyText = buildPostCopyText(item.title, sanitizePublishableCopy(item.body));

  const copyAll = async () => {
    await navigator.clipboard.writeText(copyText);
    toast.success('Copy listo — pega en tu red y sube la imagen desde el editor');
  };

  const openPlatform = () => {
    const url = getPlatformPublishUrl(item.platform);
    if (!url) {
      void copyAll();
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.message('Red abierta — el copy ya está en tu portapapeles');
    void navigator.clipboard.writeText(copyText);
  };

  const shareWhatsApp = () => {
    window.open(buildWhatsAppShareUrl(copyText), '_blank', 'noopener,noreferrer');
    setMoreOpen(false);
  };

  const copyCaptureLink = async () => {
    const form = captureFormQuery.data;
    if (!form) {
      toast.error('Preparando formulario de captura…');
      return;
    }

    const url = buildCapturePageUrl(form.id, {
      contentId: item.contentId,
      utm_source: item.platform ?? 'social',
      productId: item.productId ?? undefined,
    });

    await navigator.clipboard.writeText(url);
    toast.success('Link de captura copiado — ponlo en tu bio o CTA del post');
    setMoreOpen(false);
  };

  const moreActions = (
    <>
      <Button type="button" size="sm" variant="ghost" className="w-full justify-start" onClick={shareWhatsApp}>
        <MessageCircle className="mr-2 h-3.5 w-3.5" />
        WhatsApp
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="w-full justify-start"
        disabled={captureFormQuery.isLoading}
        title="URL con UTM para pegar en bio, stories o CTA del post"
        onClick={() => void copyCaptureLink()}
      >
        <Link2 className="mr-2 h-3.5 w-3.5" />
        Link captura
      </Button>
      {showRegenerate ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="w-full justify-start"
          disabled={regenerateMutation.isPending}
          onClick={() => {
            regenerateMutation.mutate();
            setMoreOpen(false);
          }}
        >
          <RefreshCw
            className={`mr-2 h-3.5 w-3.5 ${regenerateMutation.isPending ? 'animate-spin' : ''}`}
          />
          Otra versión
        </Button>
      ) : null}
    </>
  );

  return (
    <div
      className={
        layout === 'footer'
          ? 'flex flex-wrap items-center justify-end gap-[var(--spacing-sm)]'
          : 'mt-[var(--spacing-md)] flex flex-wrap gap-[var(--spacing-sm)]'
      }
    >
      {canApprove && (
        <>
          <Button
            type="button"
            size="sm"
            className={primaryButtonClass}
            loading={approveMutation.isPending}
            disabled={approvalBusy}
            onClick={() => approveMutation.mutate()}
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            Aprobar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={primaryButtonClass}
            loading={rejectMutation.isPending}
            disabled={approvalBusy}
            onClick={() => rejectMutation.mutate()}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Rechazar
          </Button>
        </>
      )}
      <Button type="button" size="sm" className={primaryButtonClass} onClick={() => void copyAll()}>
        <Copy className="mr-1 h-3.5 w-3.5" />
        Copiar texto
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={primaryButtonClass}
        onClick={openPlatform}
      >
        <ExternalLink className="mr-1 h-3.5 w-3.5" />
        Abrir red
      </Button>

      <div className="relative">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={primaryButtonClass}
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          onClick={() => setMoreOpen((open) => !open)}
        >
          <MoreHorizontal className="mr-1 h-3.5 w-3.5" />
          Más
        </Button>
        {moreOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Cerrar menú"
              onClick={() => setMoreOpen(false)}
            />
            <div
              role="menu"
              className="absolute right-0 z-50 mt-1 min-w-[11rem] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg"
            >
              {moreActions}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default InboxQuickPublishActions;
