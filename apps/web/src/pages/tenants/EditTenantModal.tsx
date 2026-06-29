import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/molecules/Dialog';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { toast } from '@/components/molecules/Sonner';
import { getApiErrorMessage } from '@/services/api';
import { listPackages } from '@/services/packages';
import { getTenant, updateTenant } from '@/services/tenants';
import { useAuthStore } from '@/store/auth';
import type { Tenant, TenantPlan, TenantStatus } from '@/types/tenant';

interface EditTenantModalProps {
  tenantId: string | null;
  visible: boolean;
  onHide: () => void;
  onUpdated: () => void;
}

const selectClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

const STATUS_OPTIONS: Array<{ label: string; value: TenantStatus }> = [
  { label: 'Activo', value: 'active' },
  { label: 'Suspendido', value: 'suspended' },
  { label: 'Eliminado', value: 'deleted' },
];

const PLAN_OPTIONS: Array<{ label: string; value: TenantPlan }> = [
  { label: 'Starter', value: 'starter' },
  { label: 'Professional', value: 'professional' },
  { label: 'Enterprise', value: 'enterprise' },
];

export function EditTenantModal({
  tenantId,
  visible,
  onHide,
  onUpdated,
}: EditTenantModalProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [name, setName] = useState('');
  const [plan, setPlan] = useState<TenantPlan>('starter');
  const [status, setStatus] = useState<TenantStatus>('active');
  const [packageId, setPackageId] = useState('');
  const [maxUsers, setMaxUsers] = useState('5');
  const [assignMeAsPlatformAdmin, setAssignMeAsPlatformAdmin] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const tenantQuery = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => getTenant(tenantId!),
    enabled: visible && !!tenantId,
  });

  const packagesQuery = useQuery({
    queryKey: ['packages', { activeOnly: true }],
    queryFn: () => listPackages(false),
    enabled: visible,
  });

  const activePackages = packagesQuery.data?.items ?? [];

  useEffect(() => {
    const tenant = tenantQuery.data;
    if (!tenant) return;

    setName(tenant.name);
    setPlan(tenant.plan);
    setStatus(tenant.status);
    setPackageId(tenant.packageId ?? '');
    setMaxUsers(String(tenant.maxUsers));
    setAssignMeAsPlatformAdmin(
      !!currentUser?.id &&
        (tenant.platformAdmins ?? []).some((admin) => admin.id === currentUser.id),
    );
    setSubmitError('');
  }, [tenantQuery.data, currentUser?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId || !currentUser?.isSuperadmin) {
        throw new Error('Sesión inválida');
      }

      const existingIds = (tenantQuery.data?.platformAdmins ?? []).map((admin) => admin.id);
      const platformAdminIds = assignMeAsPlatformAdmin
        ? [...new Set([...existingIds, currentUser.id])]
        : existingIds.filter((id) => id !== currentUser.id);

      return updateTenant(tenantId, {
        name: name.trim(),
        plan,
        status,
        packageId: packageId || undefined,
        maxUsers: Number.parseInt(maxUsers, 10),
        platformAdminIds,
      });
    },
    onSuccess: () => {
      toast.success('Tenant actualizado');
      onUpdated();
      onHide();
    },
    onError: (error) => {
      setSubmitError(getApiErrorMessage(error));
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    saveMutation.mutate();
  };

  const tenant = tenantQuery.data as Tenant | undefined;

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Editar tenant"
      className="w-full max-w-lg"
    >
      {tenantQuery.isLoading ? (
        <p className="text-sm text-[var(--foreground-muted)]">Cargando tenant…</p>
      ) : tenantQuery.isError ? (
        <p className="text-sm text-[var(--destructive)]">
          {getApiErrorMessage(tenantQuery.error, 'No se pudo cargar el tenant')}
        </p>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <InputText
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Slug
            </label>
            <p className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground-muted)]">
              {tenant?.slug}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Plan
              </label>
              <select
                className={selectClass}
                value={plan}
                onChange={(e) => setPlan(e.target.value as TenantPlan)}
              >
                {PLAN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Estado
              </label>
              <select
                className={selectClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as TenantStatus)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Paquete
            </label>
            <select
              className={selectClass}
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
            >
              <option value="">Sin paquete</option>
              {activePackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </div>

          <InputText
            label="Usuarios máximos"
            type="number"
            min={1}
            value={maxUsers}
            onChange={(e) => setMaxUsers(e.target.value)}
            required
            fullWidth
          />

          <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)] p-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={assignMeAsPlatformAdmin}
              onChange={(e) => setAssignMeAsPlatformAdmin(e.target.checked)}
            />
            <span className="text-sm text-[var(--foreground)]">
              <span className="font-semibold">Asignarme como administrador de plataforma</span>
              <span className="mt-1 block text-[var(--foreground-muted)]">
                Permite impersonar este tenant aunque no tenga owner/admin activo. Tu login
                seguirá abriendo la consola superadmin.
              </span>
            </span>
          </label>

          {submitError ? (
            <p className="text-sm text-[var(--destructive)]">{submitError}</p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onHide}>
              Cancelar
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
