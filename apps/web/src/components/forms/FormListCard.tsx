import { Code2, FileInput, Trash2 } from 'lucide-react';
import { IconButton, ACTION_BUTTON_GROUP_CLASS } from '@/components/atoms/IconButton';
import { StatusPill } from '@/components/atoms/StatusPill';
import { listCardClassName } from '@/lib/list-card';
import type { Form } from '@/types/forms';

export interface FormListCardProps {
  form: Form;
  productLabel: string;
  selected: boolean;
  deleting: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function FormListCard({
  form,
  productLabel,
  selected,
  deleting,
  onSelect,
  onDelete,
}: FormListCardProps) {
  return (
    <article
      className={listCardClassName(
        selected
          ? 'border-[var(--primary)]/40 bg-[var(--primary)]/5 hover:border-[var(--primary)]/50'
          : undefined,
      )}
    >
      <div className="flex items-start justify-between gap-[var(--spacing-sm)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[var(--spacing-xs)]">
            <FileInput className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
            <h3 className="truncate font-semibold text-[var(--foreground)]">{form.name}</h3>
          </div>
          <p className="mt-[var(--spacing-xs)] text-sm text-[var(--foreground-muted)]">
            {productLabel}
          </p>
          <div className="mt-[var(--spacing-sm)] flex flex-wrap items-center gap-[var(--spacing-sm)]">
            <StatusPill status={form.isActive ? 'success' : 'neutral'} size="sm">
              {form.isActive ? 'Activo' : 'Inactivo'}
            </StatusPill>
            <span className="text-xs text-[var(--foreground-muted)]">
              {new Date(form.createdAt).toLocaleDateString('es-ES')}
            </span>
          </div>
        </div>
        <div className={ACTION_BUTTON_GROUP_CLASS}>
          <IconButton
            type="button"
            tone={selected ? 'selected' : 'default'}
            label="Ver snippet"
            onClick={onSelect}
          >
            <Code2 />
          </IconButton>
          <IconButton
            type="button"
            tone="destructive"
            label="Eliminar formulario"
            loading={deleting}
            onClick={onDelete}
          >
            <Trash2 />
          </IconButton>
        </div>
      </div>
    </article>
  );
}

export default FormListCard;
