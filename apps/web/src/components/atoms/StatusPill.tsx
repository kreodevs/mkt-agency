import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const statusPillVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[var(--spacing-xxs)] text-xs font-semibold transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
  {
    variants: {
      status: {
        success:
          'border-[var(--success)]/20 bg-[var(--success)]/10 text-[var(--success)]',
        warning:
          'border-[var(--warning)]/20 bg-[var(--warning)]/10 text-[var(--warning)]',
        error:
          'border-[var(--destructive)]/20 bg-[var(--destructive)]/10 text-[var(--destructive)]',
        info: 'border-[var(--info)]/20 bg-[var(--info)]/10 text-[var(--info)]',
        neutral:
          'border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground-muted)]',
        luxury:
          'border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary)] shadow-gold',
      },
      size: {
        sm: 'px-[var(--spacing-sm)] py-0.25 text-[10px]',
        md: 'px-2.5 py-[var(--spacing-xxs)] text-xs',
        lg: 'px-[var(--spacing-md)] py-[var(--spacing-xs)] text-sm',
      },
    },
    defaultVariants: {
      status: 'neutral',
      size: 'md',
    },
  },
);

export interface StatusPillProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusPillVariants> {
  icon?: ReactNode;
}

export function StatusPill({
  className,
  status,
  size,
  icon,
  children,
  ...props
}: StatusPillProps) {
  return (
    <div className={cn(statusPillVariants({ status, size, className }))} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </div>
  );
}

export default StatusPill;
