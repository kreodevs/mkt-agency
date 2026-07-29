import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/molecules/Sonner';
import { markContentPublished, publishInboxContentWithN8n } from '@/services/publication-inbox';
import { ApiError } from '@/services/api';
import type { PublicationInboxItem } from '@/types/publication-inbox';

export function useInboxPublishActions(item: PublicationInboxItem) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
    void queryClient.invalidateQueries({ queryKey: ['calendar'] });
    void queryClient.invalidateQueries({ queryKey: ['calendar-day'] });
    void queryClient.invalidateQueries({ queryKey: ['content', item.contentId] });
  };

  const publishN8nMutation = useMutation({
    mutationFn: () => publishInboxContentWithN8n(item.contentId),
    onSuccess: (result) => {
      if (result.dispatched) {
        toast.success('Arte enviado a n8n — se marcará publicado cuando el flujo termine');
      } else {
        toast.message(result.reason ?? 'No se envió al webhook');
      }
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo publicar con n8n');
    },
  });

  const markPublishedMutation = useMutation({
    mutationFn: () => markContentPublished(item.contentId),
    onSuccess: async () => {
      await invalidate();
      toast.success('Arte marcado como publicado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo marcar como publicado');
    },
  });

  const isApproved = Boolean(item.signatureHash);
  const isPublished = Boolean(item.publishedAt);
  const canPublishWithN8n = Boolean(item.canPublishWithN8n) && isApproved && !isPublished;
  const canMarkPublishedManually = isApproved && !isPublished;

  return {
    publishN8nMutation,
    markPublishedMutation,
    canPublishWithN8n,
    canMarkPublishedManually,
    isPublished,
    isApproved,
  };
}
