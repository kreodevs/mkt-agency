import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  description,
  eyebrow,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) => (
  <div
    className={cn(
      'mb-[var(--spacing-xl)] flex flex-col justify-between gap-[var(--spacing-md)] animate-fade-in md:flex-row md:items-start motion-reduce:animate-none',
      className,
    )}
  >
    <div className="flex flex-col gap-1.5">
      {breadcrumbs && <div className="mb-[var(--spacing-sm)]">{breadcrumbs}</div>}
      {eyebrow && (
        <p className="type-detail-xs font-semibold uppercase tracking-wider text-[var(--brand)]">
          {eyebrow}
        </p>
      )}
      <h1 className="type-ui-sans-semibold text-[var(--foreground)]">{title}</h1>
      {description && (
        <p className="type-body-serif-s mt-[var(--spacing-xs)] max-w-2xl text-[var(--foreground-muted)]">
          {description}
        </p>
      )}
    </div>
    {actions && (
      <div className="flex w-full shrink-0 flex-wrap items-center gap-[var(--spacing-sm)] md:w-auto md:justify-end md:gap-[var(--spacing-md)]">
        {actions}
      </div>
    )}
  </div>
);

export default PageHeader;
