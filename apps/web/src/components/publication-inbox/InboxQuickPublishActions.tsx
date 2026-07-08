import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, ExternalLink, Link2, MessageCircle, RefreshCw, X } from 'lucide-react';
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
}

function needsApproval(item: PublicationInboxItem): boolean {
  return Boolean(item.versionId && !item.signatureHash && item.status !== 'rejected');
}

export function InboxQuickPublishActions({
  item,
  showRegenerate = true,
  showApproval = false,
  onRejected,
}: InboxQuickPublishActionsProps) {
  const queryClient = useQueryClient();
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
  };

  return (
    <div className="mt-[var(--spacing-md)] flex flex-wrap gap-[var(--spacing-sm)]">
      {canApprove && (
        <>
          <Button
            type="button"
            size="sm"
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
            loading={rejectMutation.isPending}
            disabled={approvalBusy}
            onClick={() => rejectMutation.mutate()}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Rechazar
          </Button>
        </>
      )}
      <Button type="button" size="sm" onClick={() => void copyAll()}>
        <Copy className="mr-1 h-3.5 w-3.5" />
        Copiar texto
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={openPlatform}>
        <ExternalLink className="mr-1 h-3.5 w-3.5" />
        Abrir red
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={shareWhatsApp}>
        <MessageCircle className="mr-1 h-3.5 w-3.5" />
        WhatsApp
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={captureFormQuery.isLoading}
        onClick={() => void copyCaptureLink()}
      >
        <Link2 className="mr-1 h-3.5 w-3.5" />
        Link captura
      </Button>
      {showRegenerate && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={regenerateMutation.isPending}
          onClick={() => regenerateMutation.mutate()}
        >
          <RefreshCw
            className={`mr-1 h-3.5 w-3.5 ${regenerateMutation.isPending ? 'animate-spin' : ''}`}
          />
          Otra versión
        </Button>
      )}
    </div>
  );
}

export default InboxQuickPublishActions;
