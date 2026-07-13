import { exitImpersonation } from '@/lib/impersonation';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/atoms/Button';

export function ImpersonationContextBar() {
  const tenantName = useAuthStore((s) => s.impersonationTenantName);
  const email = useAuthStore((s) => s.user?.email);

  if (!tenantName) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--warning)]/30 bg-[var(--warning)]/10 px-4 py-2 text-sm md:px-6 lg:px-8">
      <p className="text-[var(--foreground)]">
        <span className="font-medium">Viendo como</span>{' '}
        <span className="font-semibold">{tenantName}</span>
        {email ? (
          <span className="text-[var(--foreground-muted)]"> · {email}</span>
        ) : null}
      </p>
      <Button type="button" size="sm" variant="outline" onClick={() => exitImpersonation()}>
        Volver a consola
      </Button>
    </div>
  );
}
