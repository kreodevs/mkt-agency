import { Package, Pencil, Trash2 } from 'lucide-react';
import { IconButton, ACTION_BUTTON_GROUP_CLASS } from '@/components/atoms/IconButton';
import { StatusPill } from '@/components/atoms/StatusPill';
import type { Package as PackageType } from '@/services/packages';

function formatBytes(bytes: number) {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export interface PackageListCardProps {
  pkg: PackageType;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function PackageListCard({ pkg, deleting, onEdit, onDelete }: PackageListCardProps) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-[var(--spacing-md)]">
      <div className="flex items-start justify-between gap-[var(--spacing-sm)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[var(--spacing-xs)]">
            <Package className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
            <h3 className="truncate font-semibold text-[var(--foreground)]">{pkg.name}</h3>
          </div>
          <p className="mt-[var(--spacing-xs)] text-sm text-[var(--foreground-muted)]">{pkg.slug}</p>
          <p className="mt-[var(--spacing-sm)] text-xs text-[var(--foreground-muted)]">
            {pkg.maxUsers} usuarios · {formatBytes(pkg.maxAssetsSize)} storage ·{' '}
            {formatBytes(pkg.maxFileSize)}/archivo
          </p>
          <div className="mt-[var(--spacing-sm)]">
            <StatusPill status={pkg.isActive ? 'success' : 'neutral'} size="sm">
              {pkg.isActive ? 'Activo' : 'Inactivo'}
            </StatusPill>
          </div>
        </div>
        <div className={ACTION_BUTTON_GROUP_CLASS}>
          <IconButton label="Editar paquete" onClick={onEdit}>
            <Pencil />
          </IconButton>
          <IconButton tone="destructive" label="Eliminar paquete" loading={deleting} onClick={onDelete}>
            <Trash2 />
          </IconButton>
        </div>
      </div>
    </article>
  );
}

export default PackageListCard;
