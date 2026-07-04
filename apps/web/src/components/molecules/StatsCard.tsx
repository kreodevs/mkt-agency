import { forwardRef, type ReactNode } from 'react';
import { Card } from '@/components/molecules/Card';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  iconTone?: 'primary' | 'success' | 'warning' | 'accent';
  className?: string;
}

const iconToneClass: Record<NonNullable<StatsCardProps['iconTone']>, string> = {
  primary: 'border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary)]',
  success: 'border-[var(--success)]/20 bg-[var(--success)]/10 text-[var(--success)]',
  warning: 'border-[var(--warning)]/20 bg-[var(--warning)]/10 text-[var(--warning)]',
  accent: 'border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]',
};

export const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
  ({ title, value, description, icon, iconTone = 'primary', className }, ref) => (
    <Card ref={ref} className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-[var(--spacing-md)]">
        <div className="space-y-[var(--spacing-xs)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-[var(--foreground)]">{value}</p>
        </div>
        {icon && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border',
              iconToneClass[iconTone],
            )}
          >
            {icon}
          </div>
        )}
      </div>
      {description && (
        <p className="mt-[var(--spacing-md)] text-xs text-[var(--foreground-subtle)]">{description}</p>
      )}
    </Card>
  ),
);

StatsCard.displayName = 'StatsCard';

export default StatsCard;
