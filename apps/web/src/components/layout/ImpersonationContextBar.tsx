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
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[var(--z-fixed)] flex flex-wrap items-center justify-between gap-[var(--spacing-sm)] border-b border-[var(--warning)]/30 bg-[var(--warning)]/10 px-4 py-2 text-sm md:px-6 lg:px-8"
    >
      <p className="min-w-0 text-[var(--foreground)]">
        <span className="font-medium">Viendo como</span>{' '}
        <span className="font-semibold">{tenantName}</span>
        {email ? (
          <span className="text-[var(--foreground-muted)]"> · {email}</span>
        ) : null}
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={() => exitImpersonation()}
      >
        Volver a consola
      </Button>
    </div>
  );
}
