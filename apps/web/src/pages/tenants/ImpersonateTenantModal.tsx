import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Dialog } from '@/components/molecules/Dialog';
import { startImpersonation } from '@/services/superadmin';
import type { Tenant } from '@/types/tenant';

interface ImpersonateTenantModalProps {
  tenant: Tenant | null;
  visible: boolean;
  onHide: () => void;
  onStarted: () => void;
}

export function ImpersonateTenantModal({
  tenant,
  visible,
  onHide,
  onStarted,
}: ImpersonateTenantModalProps) {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setUserId('');
    setError(null);
    onHide();
  };

  const handleSubmit = async () => {
    if (!tenant) return;

    const trimmedUserId = userId.trim();
    if (!trimmedUserId) {
      setError('Indica el UUID del usuario del tenant.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await startImpersonation({ tenantId: tenant.id, userId: trimmedUserId });
      handleClose();
      onStarted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la impersonación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header="Impersonar tenant"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} loading={loading}>
            Iniciar impersonación
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--foreground-muted)]">
          Sesión temporal de 1 hora como usuario del tenant{' '}
          <strong>{tenant?.name}</strong>. Las acciones destructivas están bloqueadas.
        </p>
        <InputText
          label="Usuario (UUID)"
          placeholder="00000000-0000-0000-0000-000000000000"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
        />
        {error ? <p className="text-sm text-[var(--destructive)]">{error}</p> : null}
      </div>
    </Dialog>
  );
}
