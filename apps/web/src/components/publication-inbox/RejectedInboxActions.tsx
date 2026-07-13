import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import {
  CONTENT_VISUAL_FORMAT_LABELS,
  CONTENT_VISUAL_FORMATS,
  normalizeContentVisualFormat,
  type ContentVisualFormat,
} from '@/lib/visual-format';
import { deleteInboxContent, regenerateInboxContent } from '@/services/publication-inbox';
import type { PublicationInboxItem } from '@/types/publication-inbox';

interface RejectedInboxActionsProps {
  item: PublicationInboxItem;
}

export function RejectedInboxActions({ item }: RejectedInboxActionsProps) {
  const queryClient = useQueryClient();
  const [showFormats, setShowFormats] = useState(false);
  const currentFormat = normalizeContentVisualFormat(item.visualFormat);
  const formatOptions = CONTENT_VISUAL_FORMATS.filter((format) => format !== currentFormat);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
    await queryClient.invalidateQueries({
      queryKey: ['image-generation-by-content', item.contentId],
    });
  };

  const regenerateMutation = useMutation({
    mutationFn: (visualFormat: ContentVisualFormat) =>
      regenerateInboxContent(item.contentId, { visualFormat }),
    onSuccess: async (result) => {
      await invalidate();
      setShowFormats(false);
      toast.success(`Nueva versión en camino: ${result.title}`);
    },
    onError: () => toast.error('No se pudo regenerar'),
  });

  const dismissMutation = useMutation({
    mutationFn: () => deleteInboxContent(item.contentId),
    onSuccess: async () => {
      await invalidate();
      toast.message('Publicación eliminada');
    },
    onError: () => toast.error('No se pudo eliminar'),
  });

  const isBusy = regenerateMutation.isPending || dismissMutation.isPending;

  return (
    <div className="mt-[var(--spacing-md)] space-y-[var(--spacing-sm)] rounded-[var(--radius-md)] border border-[var(--error)]/20 bg-[var(--error)]/5 p-[var(--spacing-md)]">
      <p className="text-sm font-medium text-[var(--foreground)]">Opciones tras el rechazo</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isBusy}
          onClick={() => setShowFormats((open) => !open)}
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Otro formato
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isBusy}
          loading={dismissMutation.isPending}
          onClick={() => dismissMutation.mutate()}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Eliminar
        </Button>
      </div>

      {showFormats && (
        <div className="flex flex-wrap gap-2 pt-1">
          {formatOptions.map((format) => (
            <Button
              key={format}
              type="button"
              size="sm"
              variant={regenerateMutation.isPending ? 'outline' : 'default'}
              disabled={isBusy}
              loading={regenerateMutation.isPending}
              onClick={() => regenerateMutation.mutate(format)}
            >
              {CONTENT_VISUAL_FORMAT_LABELS[format]}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export default RejectedInboxActions;
