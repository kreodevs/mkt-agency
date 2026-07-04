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
  requestContentChanges,
} from '@/services/content';
import type { ContentVersion } from '@/types/content';

interface ApprovalActionsProps {
  contentId: string;
  version: ContentVersion;
  disabled?: boolean;
  sohoMode?: boolean;
}

export function ApprovalActions({ contentId, version, disabled, sohoMode }: ApprovalActionsProps) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState('');

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['content', contentId] });
    void queryClient.invalidateQueries({ queryKey: ['content-versions', contentId] });
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
      toast.message('Versión rechazada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo rechazar');
    },
  });

  const changesMutation = useMutation({
    mutationFn: () => requestContentChanges(contentId, version.id, feedback || undefined),
    onSuccess: () => {
      invalidate();
      toast.message('Cambios solicitados — nueva versión en borrador');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo solicitar cambios');
    },
  });

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
          ? 'Aprueba para copiar y publicar'
          : 'Kill Switch — firma SHA-256 al aprobar'
      }
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-[var(--spacing-xs)]">
          <label className="text-sm font-medium text-[var(--foreground)]">
            Feedback (opcional)
          </label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="Comentarios para el equipo o la IA"
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
            disabled={disabled || isBusy}
            onClick={() => changesMutation.mutate()}
          >
            <MessageSquare className="mr-1 h-4 w-4" />
            Solicitar cambios
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ApprovalActions;
