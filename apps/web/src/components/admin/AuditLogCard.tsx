import { ScrollText } from 'lucide-react';
import { listCardClassName } from '@/lib/list-card';
import type { AuditLog } from '@/types/audit';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export interface AuditLogCardProps {
  log: AuditLog;
}

export function AuditLogCard({ log }: AuditLogCardProps) {
  const resource =
    log.resourceType && log.resourceId
      ? `${log.resourceType}:${log.resourceId.slice(0, 8)}…`
      : log.resourceType ?? '—';

  return (
    <article className={listCardClassName()}>
      <div className="flex items-start gap-[var(--spacing-sm)]">
        <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[var(--foreground)]">{log.action}</p>
          <p className="mt-[var(--spacing-xs)] text-xs text-[var(--foreground-muted)]">
            {formatDate(log.createdAt)}
          </p>
          <dl className="mt-[var(--spacing-sm)] grid gap-1 text-xs text-[var(--foreground-muted)]">
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-[var(--foreground)]">Tenant</dt>
              <dd className="truncate">{log.tenantId ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-[var(--foreground)]">Usuario</dt>
              <dd className="truncate">{log.userId ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-[var(--foreground)]">Recurso</dt>
              <dd className="truncate">{resource}</dd>
            </div>
            {log.ipAddress ? (
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium text-[var(--foreground)]">IP</dt>
                <dd>{log.ipAddress}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </article>
  );
}

export default AuditLogCard;
