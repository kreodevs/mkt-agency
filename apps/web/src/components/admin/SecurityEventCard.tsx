import { ShieldAlert } from 'lucide-react';
import { StatusPill } from '@/components/atoms/StatusPill';
import type { SecurityEvent, SecurityEventSeverity } from '@/types/security';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  );
}

function severityStatus(severity: SecurityEventSeverity) {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'error' as const;
    case 'medium':
      return 'warning' as const;
    case 'low':
      return 'info' as const;
    default:
      return 'neutral' as const;
  }
}

export interface SecurityEventCardProps {
  event: SecurityEvent;
}

export function SecurityEventCard({ event }: SecurityEventCardProps) {
  const metadata =
    event.metadata && Object.keys(event.metadata).length > 0
      ? JSON.stringify(event.metadata)
      : null;

  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-[var(--spacing-md)]">
      <div className="flex items-start gap-[var(--spacing-sm)]">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-[var(--spacing-sm)]">
            <p className="font-medium text-[var(--foreground)]">{event.eventType}</p>
            <StatusPill status={severityStatus(event.severity)} size="sm">
              {event.severity}
            </StatusPill>
          </div>
          <p className="mt-[var(--spacing-xs)] text-xs text-[var(--foreground-muted)]">
            {formatDate(event.createdAt)}
          </p>
          <dl className="mt-[var(--spacing-sm)] grid gap-1 text-xs text-[var(--foreground-muted)]">
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-[var(--foreground)]">Tenant</dt>
              <dd className="truncate">{event.tenantId ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-[var(--foreground)]">Usuario</dt>
              <dd className="truncate">{event.userId ?? '—'}</dd>
            </div>
            {event.ipAddress ? (
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium text-[var(--foreground)]">IP</dt>
                <dd>{event.ipAddress}</dd>
              </div>
            ) : null}
          </dl>
          {metadata ? (
            <p className="mt-[var(--spacing-sm)] line-clamp-3 break-all text-xs text-[var(--foreground-subtle)]">
              {metadata}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default SecurityEventCard;
