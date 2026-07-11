import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--background-secondary)] text-center animate-in fade-in zoom-in-95 duration-300',
        compact ? 'px-[var(--spacing-md)] py-[var(--spacing-lg)]' : 'min-h-[12rem] p-[var(--spacing-xl)]',
        className,
      )}
    >
      <div className="mb-[var(--spacing-md)] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--foreground-muted)]">
        <Icon className="h-7 w-7 opacity-60" aria-hidden />
      </div>
      <h3 className="mb-[var(--spacing-xs)] text-base font-semibold text-[var(--foreground)]">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-[var(--foreground-muted)]">{description}</p>
      )}
      {action && (
        <Button type="button" variant="outline" size="sm" className="mt-[var(--spacing-md)]" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
