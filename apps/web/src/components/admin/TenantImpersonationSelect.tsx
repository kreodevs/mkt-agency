import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listTenants } from '@/services/tenants';
import { impersonateTenant } from '@/services/superadmin';
import { getApiErrorMessage } from '@/services/api';
import type { Tenant } from '@/types/tenant';
import {
  IMPERSONATION_CONSOLE_VALUE,
  ImpersonationTenantDropdown,
} from './ImpersonationTenantDropdown';

export function TenantImpersonationSelect() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const tenantsQuery = useQuery({
    queryKey: ['tenants-impersonation'],
    queryFn: () => listTenants({ page: 1, limit: 100, status: 'active' }),
    retry: 2,
  });

  const sorted = useMemo(
    () => [...(tenantsQuery.data?.items ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [tenantsQuery.data?.items],
  );

  const loadError = tenantsQuery.isError
    ? getApiErrorMessage(tenantsQuery.error, 'No se pudieron cargar los tenants')
    : null;

  return (
    <div className="flex min-w-0 max-w-full flex-col items-end gap-1">
      <ImpersonationTenantDropdown
        value={IMPERSONATION_CONSOLE_VALUE}
        options={sorted.map((tenant: Tenant) => ({ id: tenant.id, name: tenant.name }))}
        busy={busy}
        loading={tenantsQuery.isLoading || tenantsQuery.isFetching}
        error={loadError}
onSelect={(tenantId) => {
          if (tenantId === IMPERSONATION_CONSOLE_VALUE) return;

          setBusy(true);
          setActionError(null);
          void impersonateTenant(tenantId)
            .then(() => navigate('/'))
            .catch((err) => {
              setActionError(getApiErrorMessage(err));
              setBusy(false);
            });
        }}
      />
      {actionError ? (
        <span className="max-w-[16rem] truncate text-xs text-[var(--destructive)]">{actionError}</span>
      ) : null}
    </div>
  );
}
