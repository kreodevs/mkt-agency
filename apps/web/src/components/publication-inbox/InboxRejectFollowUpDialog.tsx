import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Dialog } from '@/components/molecules/Dialog';
import { toast } from '@/components/molecules/Sonner';
import {
  CONTENT_VISUAL_FORMAT_HINTS,
  CONTENT_VISUAL_FORMAT_LABELS,
  CONTENT_VISUAL_FORMATS,
  normalizeContentVisualFormat,
  type ContentVisualFormat,
} from '@/lib/visual-format';
import { dismissInboxContent, regenerateInboxContent } from '@/services/publication-inbox';

export interface InboxRejectFollowUpContext {
  contentId: string;
  title: string;
  visualFormat: string;
}

interface InboxRejectFollowUpDialogProps {
  context: InboxRejectFollowUpContext | null;
  onClose: () => void;
}

export function InboxRejectFollowUpDialog({ context, onClose }: InboxRejectFollowUpDialogProps) {
  const queryClient = useQueryClient();
  const [selectedFormat, setSelectedFormat] = useState<ContentVisualFormat | null>(null);

  const currentFormat = normalizeContentVisualFormat(context?.visualFormat);
  const formatOptions = CONTENT_VISUAL_FORMATS.filter((format) => format !== currentFormat);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
    if (context?.contentId) {
      await queryClient.invalidateQueries({
        queryKey: ['image-generation-by-content', context.contentId],
      });
    }
  };

  const regenerateMutation = useMutation({
    mutationFn: (visualFormat: ContentVisualFormat) =>
      regenerateInboxContent(context!.contentId, { visualFormat }),
    onSuccess: async (result) => {
      await invalidate();
      onClose();
      toast.success(`Nueva versión en camino: ${result.title}`);
    },
    onError: () => toast.error('No se pudo regenerar con el nuevo formato'),
  });

  const dismissMutation = useMutation({
    mutationFn: () => dismissInboxContent(context!.contentId),
    onSuccess: async () => {
      await invalidate();
      onClose();
      toast.message('Pieza archivada — ya no aparece en la bandeja');
    },
    onError: () => toast.error('No se pudo archivar la pieza'),
  });

  const isBusy = regenerateMutation.isPending || dismissMutation.isPending;

  return (
    <Dialog
      visible={Boolean(context)}
      onHide={onClose}
      title="Pieza rechazada"
      description="¿Quieres probar otro formato o quitarla de la bandeja?"
      size="md"
    >
      {context && (
        <div className="space-y-[var(--spacing-md)]">
          <p className="text-sm text-[var(--foreground-muted)]">
            <span className="font-medium text-[var(--foreground)]">{context.title}</span>
            {' '}quedó en rechazadas. El copiloto puede regenerarla con otro formato visual.
          </p>

          <div className="space-y-[var(--spacing-sm)]">
            <p className="text-sm font-medium text-[var(--foreground)]">Probar otro formato</p>
            <p className="text-xs text-[var(--foreground-muted)]">
              Formato actual: {CONTENT_VISUAL_FORMAT_LABELS[currentFormat]}
            </p>
            <div className="flex flex-wrap gap-2">
              {formatOptions.map((format) => (
                <button
                  key={format}
                  type="button"
                  disabled={isBusy}
                  onClick={() => setSelectedFormat(format)}
                  className={[
                    'rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm transition-colors',
                    selectedFormat === format
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]'
                      : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)]/40',
                  ].join(' ')}
                >
                  <span className="font-medium">{CONTENT_VISUAL_FORMAT_LABELS[format]}</span>
                  <span className="mt-0.5 block text-xs opacity-80">
                    {CONTENT_VISUAL_FORMAT_HINTS[format]}
                  </span>
                </button>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!selectedFormat || isBusy}
              loading={regenerateMutation.isPending}
              onClick={() => selectedFormat && regenerateMutation.mutate(selectedFormat)}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              Regenerar con este formato
            </Button>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)]">
            <p className="text-sm font-medium text-[var(--foreground)]">Quitar de la bandeja</p>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              Elimina la pieza rechazada. No volverá a aparecer en Por aprobar ni en Rechazadas.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              disabled={isBusy}
              loading={dismissMutation.isPending}
              onClick={() => dismissMutation.mutate()}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Archivar por rechazo
            </Button>
          </div>

          <div className="flex justify-end">
            <Button type="button" size="sm" variant="ghost" disabled={isBusy} onClick={onClose}>
              Dejar en rechazadas
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

export default InboxRejectFollowUpDialog;
