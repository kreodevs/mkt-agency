import { Building2, Pencil, UserRoundSearch } from 'lucide-react';
import { IconButton, ACTION_BUTTON_GROUP_CLASS } from '@/components/atoms/IconButton';
import { StatusPill } from '@/components/atoms/StatusPill';
import type { Tenant, TenantPlan, TenantStatus } from '@/types/tenant';

function statusVariant(status: TenantStatus) {
  if (status === 'active') return 'success' as const;
  if (status === 'suspended') return 'warning' as const;
  return 'error' as const;
}

function planVariant(plan: TenantPlan) {
  if (plan === 'enterprise') return 'luxury' as const;
  if (plan === 'professional') return 'info' as const;
  return 'neutral' as const;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export interface TenantListCardProps {
  tenant: Tenant;
  impersonating: boolean;
  onEdit: () => void;
  onImpersonate: () => void;
}

export function TenantListCard({
  tenant,
  impersonating,
  onEdit,
  onImpersonate,
}: TenantListCardProps) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-[var(--spacing-md)]">
      <div className="flex items-start justify-between gap-[var(--spacing-sm)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[var(--spacing-xs)]">
            <Building2 className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
            <h3 className="truncate font-semibold text-[var(--foreground)]">{tenant.name}</h3>
          </div>
          <p className="mt-[var(--spacing-xs)] text-sm text-[var(--foreground-muted)]">
            {tenant.slug}
          </p>
          <div className="mt-[var(--spacing-sm)] flex flex-wrap items-center gap-[var(--spacing-sm)]">
            <StatusPill status={planVariant(tenant.plan)} size="sm">
              {tenant.plan}
            </StatusPill>
            <StatusPill status={statusVariant(tenant.status)} size="sm">
              {tenant.status}
            </StatusPill>
            <span className="text-xs text-[var(--foreground-muted)]">
              {tenant.maxUsers} usuarios · {formatDate(tenant.createdAt)}
            </span>
          </div>
        </div>
        <div className={ACTION_BUTTON_GROUP_CLASS}>
          <IconButton label="Editar tenant" onClick={onEdit}>
            <Pencil />
          </IconButton>
          <IconButton
            tone="primary"
            label="Impersonar tenant"
            loading={impersonating}
            disabled={tenant.status !== 'active'}
            onClick={onImpersonate}
          >
            <UserRoundSearch />
          </IconButton>
        </div>
      </div>
    </article>
  );
}

export default TenantListCard;
