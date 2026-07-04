import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) => (
  <div
    className={cn(
      'mb-[var(--spacing-xl)] flex flex-col justify-between gap-[var(--spacing-md)] md:flex-row md:items-start',
      className,
    )}
  >
    <div className="flex flex-col gap-1.5">
      {breadcrumbs && <div className="mb-[var(--spacing-sm)]">{breadcrumbs}</div>}
      <h1 className="type-ui-sans-semibold text-[var(--foreground)]">
        {title}
      </h1>
      {description && (
        <p className="type-body-serif-s mt-[var(--spacing-xs)] max-w-2xl text-[var(--foreground-muted)]">
          {description}
        </p>
      )}
    </div>
    {actions && (
      <div className="flex shrink-0 items-center gap-[var(--spacing-md)]">{actions}</div>
    )}
  </div>
);

export default PageHeader;
