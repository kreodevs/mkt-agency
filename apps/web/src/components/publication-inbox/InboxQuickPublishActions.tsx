import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, Link2, MessageCircle, RefreshCw } from 'lucide-react';
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
import { regenerateInboxContent } from '@/services/publication-inbox';
import type { PublicationInboxItem } from '@/types/publication-inbox';

interface InboxQuickPublishActionsProps {
  item: PublicationInboxItem;
  showRegenerate?: boolean;
}

export function InboxQuickPublishActions({
  item,
  showRegenerate = true,
}: InboxQuickPublishActionsProps) {
  const queryClient = useQueryClient();

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
    <div className="mt-3 flex flex-wrap gap-2">
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
