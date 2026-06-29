import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listTenants } from '@/services/tenants';
import { impersonateTenant } from '@/services/superadmin';
import { getApiErrorMessage } from '@/services/api';
import type { Tenant } from '@/types/tenant';

const CONSOLE_VALUE = '__console__';

const SELECT_CLASS =
  'h-9 min-w-0 max-w-[12rem] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50 sm:max-w-[16rem]';

export function TenantImpersonationSelect() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantsQuery = useQuery({
    queryKey: ['tenants-impersonation'],
    queryFn: () => listTenants({ page: 1, limit: 200, status: 'active' }),
  });

  const sorted = useMemo(
    () => [...(tenantsQuery.data?.items ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [tenantsQuery.data?.items],
  );

  return (
    <div className="flex min-w-0 flex-col items-end gap-1">
      <select
        className={SELECT_CLASS}
        value={CONSOLE_VALUE}
        disabled={busy || tenantsQuery.isLoading || sorted.length === 0}
        title="Impersonar tenant"
        onChange={(e) => {
          const tenantId = e.target.value;
          if (tenantId === CONSOLE_VALUE) return;

          setBusy(true);
          setError(null);
          void impersonateTenant(tenantId)
            .then(() => navigate('/'))
            .catch((err) => {
              setError(getApiErrorMessage(err));
              setBusy(false);
            });
        }}
      >
        <option value={CONSOLE_VALUE}>Consola superadmin</option>
        {sorted.map((t: Tenant) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      {error ? (
        <span className="max-w-[16rem] truncate text-xs text-[var(--destructive)]">{error}</span>
      ) : null}
    </div>
  );
}
