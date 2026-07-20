import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import { InboxContentDeleteDialog } from '@/components/publication-inbox/InboxContentDeleteDialog';
import {
  buildPostCopyText,
  buildWhatsAppShareUrl,
  getPlatformPublishUrl,
} from '@/lib/content-platform';
import { buildCapturePageUrl } from '@/lib/capture-attribution';
import { sanitizePublishableCopy } from '@/lib/sanitize-publishable-copy';
import { ensureCaptureForm } from '@/services/forms';
import { approveContentVersion, rejectContentVersion } from '@/services/content';
import { regenerateInboxContent, deleteInboxContent } from '@/services/publication-inbox';
import { ApiError } from '@/services/api';
import type { PublicationInboxItem } from '@/types/publication-inbox';
import type { InboxRejectFollowUpContext } from '@/components/publication-inbox/InboxRejectFollowUpDialog';

interface InboxQuickPublishActionsProps {
  item: PublicationInboxItem;
  showRegenerate?: boolean;
  showApproval?: boolean;
  showDelete?: boolean;
  onRejected?: (context: InboxRejectFollowUpContext) => void;
  onDeleted?: () => void;
  layout?: 'default' | 'footer';
}

function needsApproval(item: PublicationInboxItem): boolean {
  return Boolean(item.versionId && !item.signatureHash && item.status !== 'rejected');
}

const primaryButtonClass = 'min-h-11 sm:min-h-0';
const MORE_MENU_MIN_WIDTH = 176;
const MORE_MENU_Z_INDEX = 1060;

export function InboxQuickPublishActions({
  item,
  showRegenerate = true,
  showApproval = false,
  showDelete = true,
  onRejected,
  onDeleted,
  layout = 'default',
}: InboxQuickPublishActionsProps) {
  const queryClient = useQueryClient();
  const menuId = useId();
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreMenuStyle, setMoreMenuStyle] = useState<React.CSSProperties>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const canApprove = showApproval && needsApproval(item);

  useEffect(() => {
    if (!moreOpen || !moreTriggerRef.current) return;

    const updatePosition = () => {
      if (!moreTriggerRef.current) return;
      const rect = moreTriggerRef.current.getBoundingClientRect();
      const width = MORE_MENU_MIN_WIDTH;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 220 && rect.top > 220;

      setMoreMenuStyle({
        position: 'fixed',
        top: openUp ? Math.max(8, rect.top - 8) : rect.bottom + 4,
        left: Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8),
        width,
        zIndex: MORE_MENU_Z_INDEX,
        transform: openUp ? 'translateY(-100%)' : undefined,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (moreTriggerRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      setMoreOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuId, moreOpen]);

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

  const deleteMutation = useMutation({
    mutationFn: () => deleteInboxContent(item.contentId),
    onSuccess: async () => {
      await invalidate();
      setDeleteOpen(false);
      setMoreOpen(false);
      onDeleted?.();
      toast.message('Publicación eliminada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar');
    },
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
      {showDelete ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="w-full justify-start text-[var(--destructive)] hover:text-[var(--destructive)]"
          onClick={() => {
            setMoreOpen(false);
            setDeleteOpen(true);
          }}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Eliminar
        </Button>
      ) : null}
    </>
  );

  const moreMenu =
    moreOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            id={menuId}
            role="menu"
            style={moreMenuStyle}
            className="max-h-[min(20rem,calc(100dvh-1rem))] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg"
          >
            {moreActions}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
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
          ref={moreTriggerRef}
          type="button"
          size="sm"
          variant="ghost"
          className={primaryButtonClass}
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          aria-controls={moreOpen ? menuId : undefined}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <MoreHorizontal className="mr-1 h-3.5 w-3.5" />
          Más
        </Button>
      </div>
      {moreMenu}
      </div>

      <InboxContentDeleteDialog
        open={deleteOpen}
        description={`¿Eliminar «${item.title}»? Se borrarán todas las versiones (incluidas aprobadas).`}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </>
  );
}

export default InboxQuickPublishActions;
