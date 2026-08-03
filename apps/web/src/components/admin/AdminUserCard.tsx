import { Pencil, User } from 'lucide-react';
import { IconButton } from '@/components/atoms/IconButton';
import { StatusPill } from '@/components/atoms/StatusPill';
import type { SuperadminUser } from '@/services/superadmin';

const roleLabels: Record<string, string> = {
  owner: 'Dueño',
  admin: 'Admin',
  member: 'Miembro',
  viewer: 'Espectador',
};

const statusLabels: Record<string, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  inactive: 'Inactivo',
};

const statusPillMap: Record<string, 'success' | 'error' | 'neutral'> = {
  active: 'success',
  suspended: 'error',
  inactive: 'neutral',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(new Date(value));
}

export interface AdminUserCardProps {
  user: SuperadminUser;
  onEdit: () => void;
}

export function AdminUserCard({ user, onEdit }: AdminUserCardProps) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-[var(--spacing-md)]">
      <div className="flex items-start justify-between gap-[var(--spacing-sm)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[var(--spacing-xs)]">
            <User className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
            <h3 className="truncate font-semibold text-[var(--foreground)]">{user.name}</h3>
          </div>
          <p className="mt-[var(--spacing-xs)] truncate text-sm text-[var(--foreground-muted)]">
            {user.email}
          </p>
          {user.tenant ? (
            <p className="mt-[var(--spacing-xs)] text-xs text-[var(--foreground-muted)]">
              {user.tenant.name} · {user.tenant.slug}
            </p>
          ) : null}
          <div className="mt-[var(--spacing-sm)] flex flex-wrap items-center gap-[var(--spacing-sm)]">
            {user.isSuperadmin ? (
              <StatusPill status="luxury" size="sm">
                Superadmin
              </StatusPill>
            ) : (
              <span className="text-xs text-[var(--foreground-muted)]">
                {roleLabels[user.role] ?? user.role}
              </span>
            )}
            <StatusPill status={statusPillMap[user.status] ?? 'neutral'} size="sm">
              {statusLabels[user.status] ?? user.status}
            </StatusPill>
            <span className="text-xs text-[var(--foreground-muted)]">
              {formatDate(user.createdAt)}
            </span>
          </div>
        </div>
        <IconButton variant="ghost" label="Editar usuario" onClick={onEdit}>
          <Pencil />
        </IconButton>
      </div>
    </article>
  );
}

export default AdminUserCard;
