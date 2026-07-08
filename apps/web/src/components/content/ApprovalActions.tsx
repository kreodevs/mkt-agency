import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Textarea } from '@/components/atoms/Textarea';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  approveContentVersion,
  rejectContentVersion,
} from '@/services/content';
import { requestInboxChanges } from '@/services/publication-inbox';
import type { ContentVersion } from '@/types/content';
import type { InboxRejectFollowUpContext } from '@/components/publication-inbox/InboxRejectFollowUpDialog';

interface ApprovalActionsProps {
  contentId: string;
  version: ContentVersion;
  disabled?: boolean;
  sohoMode?: boolean;
  visualFormat?: string;
  onRejected?: (context: InboxRejectFollowUpContext) => void;
}

export function ApprovalActions({
  contentId,
  version,
  disabled,
  sohoMode,
  visualFormat = 'image',
  onRejected,
}: ApprovalActionsProps) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState('');

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['content', contentId] });
    void queryClient.invalidateQueries({ queryKey: ['content-versions', contentId] });
    void queryClient.invalidateQueries({ queryKey: ['image-generation-by-content', contentId] });
    void queryClient.invalidateQueries({ queryKey: ['calendar'] });
    void queryClient.invalidateQueries({ queryKey: ['calendar-day'] });
    void queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
  };

  const approveMutation = useMutation({
    mutationFn: () => approveContentVersion(contentId, version.id, feedback || undefined),
    onSuccess: () => {
      invalidate();
      toast.success('Contenido aprobado y congelado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo aprobar');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectContentVersion(contentId, version.id, feedback || undefined),
    onSuccess: () => {
      invalidate();
      if (sohoMode && onRejected) {
        onRejected({
          contentId,
          title: version.title,
          visualFormat,
        });
      } else {
        toast.message('Versión rechazada');
      }
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo rechazar');
    },
  });

  const changesMutation = useMutation({
    mutationFn: () =>
      requestInboxChanges(contentId, version.id, feedback.trim()),
    onSuccess: (result) => {
      invalidate();
      setFeedback('');
      toast.success(`Nueva versión generada: ${result.title}`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo aplicar el feedback');
    },
  });

  const hasFeedback = feedback.trim().length > 0;

  if (version.signatureHash) {
    return null;
  }

  const isBusy =
    approveMutation.isPending || rejectMutation.isPending || changesMutation.isPending;

  return (
    <Card
      title={sohoMode ? '¿Te gusta?' : 'Aprobación'}
      subtitle={
        sohoMode
          ? 'Describe qué cambiar y el copiloto regenera texto e imagen'
          : 'Kill Switch — firma SHA-256 al aprobar'
      }
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-[var(--spacing-xs)]">
          <label className="text-sm font-medium text-[var(--foreground)]">
            {sohoMode ? '¿Qué quieres cambiar?' : 'Feedback (opcional)'}
          </label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={sohoMode ? 3 : 2}
            placeholder={
              sohoMode
                ? 'Ej.: la imagen es muy corporativa, quiero algo más de eventos/bodas…'
                : 'Comentarios para el equipo o la IA'
            }
            disabled={disabled || isBusy}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            loading={approveMutation.isPending}
            disabled={disabled || isBusy}
            onClick={() => approveMutation.mutate()}
          >
            <Check className="mr-1 h-4 w-4" />
            Aprobar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            loading={rejectMutation.isPending}
            disabled={disabled || isBusy}
            onClick={() => rejectMutation.mutate()}
          >
            <X className="mr-1 h-4 w-4" />
            Rechazar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            loading={changesMutation.isPending}
            disabled={disabled || isBusy || !hasFeedback}
            onClick={() => changesMutation.mutate()}
          >
            <MessageSquare className="mr-1 h-4 w-4" />
            {changesMutation.isPending ? 'Regenerando…' : 'Solicitar cambios'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ApprovalActions;
