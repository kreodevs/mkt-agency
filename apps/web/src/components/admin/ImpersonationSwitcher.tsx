import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listTenants } from '@/services/tenants';
import { exitImpersonation, impersonateTenant } from '@/services/superadmin';
import { useAuthStore } from '@/store/auth';
import { isImpersonating } from '@/lib/impersonation';
import type { Tenant } from '@/types/tenant';

const CONSOLE_VALUE = '__console__';

const SELECT_CLASS =
  'h-9 min-w-0 w-full max-w-[9rem] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50 sm:w-auto sm:min-w-[10rem] sm:max-w-[16rem]';

export function ImpersonationSwitcher() {
  const tenantId = useAuthStore((s) => s.user?.tenantId);
  const [busy, setBusy] = useState(false);

  const tenantsQuery = useQuery({
    queryKey: ['tenants-impersonation-switcher'],
    queryFn: () => listTenants({ page: 1, limit: 200, status: 'active' }),
    enabled: isImpersonating(),
  });

  const sorted = useMemo(
    () => [...(tenantsQuery.data?.items ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [tenantsQuery.data?.items],
  );

  if (!isImpersonating()) return null;

  const current = sorted.find((t: Tenant) => t.id === tenantId);

  return (
    <select
      className={SELECT_CLASS}
      value={current?.id ?? tenantId ?? CONSOLE_VALUE}
      disabled={busy}
      title="Impersonación superadmin"
      onChange={(e) => {
        const value = e.target.value;
        if (value === CONSOLE_VALUE) {
          exitImpersonation();
          return;
        }

        if (value === tenantId) return;

        setBusy(true);
        void impersonateTenant(value).then(() => {
          window.location.replace('/');
        }).catch(() => {
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
  );
}
