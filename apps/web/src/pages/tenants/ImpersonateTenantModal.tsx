import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Dialog } from '@/components/molecules/Dialog';
import { apiFetch } from '@/services/api';
import { startImpersonation } from '@/services/superadmin';
import type { Tenant } from '@/types/tenant';

interface TenantUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

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
  const [selectedUserId, setSelectedUserId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const usersQuery = useQuery({
    queryKey: ['tenant-users', tenant?.id],
    queryFn: () =>
      apiFetch<TenantUser[]>(`/superadmin/tenants/${tenant!.id}/users`),
    enabled: !!tenant && visible,
  });

  const handleClose = () => {
    setSelectedUserId('');
    setError(null);
    onHide();
  };

  const handleSubmit = async () => {
    if (!tenant || !selectedUserId) return;

    setLoading(true);
    setError(null);

    try {
      await startImpersonation({ tenantId: tenant.id, userId: selectedUserId });
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
          <Button onClick={() => void handleSubmit()} loading={loading} disabled={!selectedUserId}>
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

        {usersQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando usuarios...
          </div>
        ) : usersQuery.isError ? (
          <p className="text-sm text-[var(--destructive)]">
            No se pudieron cargar los usuarios del tenant.
          </p>
        ) : (
          <>
            <label className="text-sm font-medium text-[var(--foreground)]">
              Usuario a impersonar
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="">Selecciona un usuario...</option>
              {(usersQuery.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.email}
                </option>
              ))}
            </select>
            {usersQuery.data?.length === 0 && (
              <p className="text-sm text-[var(--foreground-muted)]">
                Este tenant no tiene usuarios registrados.
              </p>
            )}
          </>
        )}

        {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
      </div>
    </Dialog>
  );
}