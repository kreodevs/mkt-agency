import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listTenants } from '@/services/tenants';
import { exitImpersonation, impersonateTenant } from '@/services/superadmin';
import { getApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { isImpersonating } from '@/lib/impersonation';
import type { Tenant } from '@/types/tenant';
import {
  IMPERSONATION_CONSOLE_VALUE,
  ImpersonationTenantDropdown,
} from './ImpersonationTenantDropdown';

export function ImpersonationSwitcher() {
  const tenantId = useAuthStore((s) => s.user?.tenantId);
  const [busy, setBusy] = useState(false);

  const tenantsQuery = useQuery({
    queryKey: ['tenants-impersonation-switcher'],
    queryFn: () => listTenants({ page: 1, limit: 100, status: 'active' }),
    enabled: isImpersonating(),
    retry: 2,
  });

  const sorted = useMemo(
    () => [...(tenantsQuery.data?.items ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [tenantsQuery.data?.items],
  );

  if (!isImpersonating()) return null;

  const current = sorted.find((tenant: Tenant) => tenant.id === tenantId);
  const loadError = tenantsQuery.isError
    ? getApiErrorMessage(tenantsQuery.error, 'No se pudieron cargar los tenants')
    : null;

  return (
    <ImpersonationTenantDropdown
      value={current?.id ?? tenantId ?? IMPERSONATION_CONSOLE_VALUE}
      options={sorted.map((tenant: Tenant) => ({ id: tenant.id, name: tenant.name }))}
      busy={busy}
      loading={tenantsQuery.isLoading || tenantsQuery.isFetching}
      error={loadError}
      className="w-auto sm:min-w-[10rem]"
      onSelect={(value) => {
        if (value === IMPERSONATION_CONSOLE_VALUE) {
          exitImpersonation();
          return;
        }

        if (value === tenantId) return;

        setBusy(true);
        void impersonateTenant(value)
          .then(() => {
            window.location.replace('/');
          })
          .catch(() => {
            setBusy(false);
          });
      }}
    />
  );
}
