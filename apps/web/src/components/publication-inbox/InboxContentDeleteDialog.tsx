import { Button } from '@/components/atoms/Button';
import { Dialog } from '@/components/molecules/Dialog';

interface InboxContentDeleteDialogProps {
  open: boolean;
  title?: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function InboxContentDeleteDialog({
  open,
  title = 'Eliminar publicación',
  description,
  confirmLabel = 'Eliminar',
  loading,
  onClose,
  onConfirm,
}: InboxContentDeleteDialogProps) {
  return (
    <Dialog
      visible={open}
      onHide={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    />
  );
}

export default InboxContentDeleteDialog;
