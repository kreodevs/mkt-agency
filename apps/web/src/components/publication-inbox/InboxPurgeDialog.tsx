import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Dialog } from '@/components/molecules/Dialog';
import { toast } from '@/components/molecules/Sonner';
import { purgeInboxContents } from '@/services/publication-inbox';
import type { InboxPurgeScope } from '@/types/publication-inbox';
import { ApiError } from '@/services/api';

const SCOPE_OPTIONS: Array<{ value: InboxPurgeScope; label: string; description: string }> = [
  {
    value: 'all',
    label: 'Toda la bandeja',
    description: 'Por aprobar, listas, próximas y rechazadas del producto activo.',
  },
  {
    value: 'pending',
    label: 'Solo por aprobar',
    description: 'Borradores y piezas en revisión.',
  },
  {
    value: 'ready',
    label: 'Solo listas para publicar',
    description: 'Incluye aprobadas con firma digital.',
  },
  {
    value: 'upcoming',
    label: 'Solo próximas',
    description: 'Programadas a futuro.',
  },
  {
    value: 'rejected',
    label: 'Solo rechazadas',
    description: 'Piezas que ya descartaste.',
  },
];

interface InboxPurgeDialogProps {
  open: boolean;
  productId?: string | null;
  onClose: () => void;
}

export function InboxPurgeDialog({ open, productId, onClose }: InboxPurgeDialogProps) {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<InboxPurgeScope>('all');
  const [confirmStep, setConfirmStep] = useState(false);

  const purgeMutation = useMutation({
    mutationFn: () => purgeInboxContents(scope, productId ?? undefined),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      void queryClient.invalidateQueries({ queryKey: ['calendar-day'] });
      void queryClient.invalidateQueries({ queryKey: ['copilot-status'] });
      setConfirmStep(false);
      onClose();
      if (result.deleted > 0) {
        toast.success(`${result.deleted} publicación(es) eliminada(s)`);
      } else {
        toast.message('No había contenido en ese alcance');
      }
      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} no se pudieron eliminar`);
      }
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo limpiar la bandeja');
    },
  });

  const handleClose = () => {
    if (purgeMutation.isPending) return;
    setConfirmStep(false);
    onClose();
  };

  const selected = SCOPE_OPTIONS.find((option) => option.value === scope);

  return (
    <Dialog
      visible={open}
      onHide={handleClose}
      title={confirmStep ? 'Confirmar eliminación' : 'Limpiar contenido'}
      description={
        confirmStep
          ? `Se eliminarán permanentemente las piezas de «${selected?.label}». Los productos y campañas no se borran.`
          : 'Elige qué publicaciones quitar de la bandeja para regenerar desde cero.'
      }
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          {confirmStep ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={purgeMutation.isPending}
                onClick={() => setConfirmStep(false)}
              >
                Atrás
              </Button>
              <Button
                type="button"
                variant="destructive"
                loading={purgeMutation.isPending}
                onClick={() => purgeMutation.mutate()}
              >
                Sí, eliminar
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={() => setConfirmStep(true)}>
                Continuar
              </Button>
            </>
          )}
        </div>
      }
    >
      {!confirmStep ? (
        <fieldset className="space-y-2">
          <legend className="sr-only">Alcance de la limpieza</legend>
          {SCOPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-[var(--radius-md)] border p-3 transition-colors ${
                scope === option.value
                  ? 'border-[var(--destructive)]/50 bg-[var(--destructive)]/5'
                  : 'border-[var(--border)] hover:border-[var(--border-strong)]'
              }`}
            >
              <input
                type="radio"
                name="purge-scope"
                className="mt-1"
                checked={scope === option.value}
                onChange={() => setScope(option.value)}
              />
              <span>
                <span className="block text-sm font-medium text-[var(--foreground)]">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--foreground-muted)]">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--destructive)]/30 bg-[var(--destructive)]/5 p-3 text-sm text-[var(--foreground-muted)]">
          <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--destructive)]" />
          <p>
            Esta acción no se puede deshacer. Incluye contenido <strong>aprobado</strong> y piezas
            con <strong>varias versiones</strong>.
          </p>
        </div>
      )}
    </Dialog>
  );
}

export default InboxPurgeDialog;
