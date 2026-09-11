import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/molecules/Reveal';

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Disable scroll stagger animation */
  static?: boolean;
}

export const PageHeader = ({
  title,
  description,
  eyebrow,
  breadcrumbs,
  actions,
  className,
  static: isStatic = false,
}: PageHeaderProps) => {
  const Wrap = isStatic
    ? ({ children }: { children: ReactNode }) => (
        <div className="animate-fade-in motion-reduce:animate-none">{children}</div>
      )
    : ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => (
        <Reveal variant="fade-up" delay={delay}>
          {children}
        </Reveal>
      );

  return (
    <div
      className={cn(
        'mb-[var(--spacing-xl)] flex flex-col justify-between gap-[var(--spacing-md)] md:flex-row md:items-start',
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        {breadcrumbs && (
          <Wrap delay={0}>
            <div className="mb-[var(--spacing-sm)]">{breadcrumbs}</div>
          </Wrap>
        )}
        {eyebrow && (
          <Wrap delay={0.05}>
            <p className="type-detail-xs font-semibold uppercase tracking-wider text-[var(--brand)]">
              {eyebrow}
            </p>
          </Wrap>
        )}
        <Wrap delay={0.1}>
          <h1 className="type-ui-sans-semibold text-[var(--foreground)]">{title}</h1>
        </Wrap>
        {description && (
          <Wrap delay={0.15}>
            <p className="type-body-serif-s mt-[var(--spacing-xs)] max-w-2xl text-[var(--foreground-muted)]">
              {description}
            </p>
          </Wrap>
        )}
      </div>
      {actions && (
        <Wrap delay={0.12}>
          <div className="flex w-full shrink-0 flex-wrap items-center gap-[var(--spacing-sm)] md:w-auto md:justify-end md:gap-[var(--spacing-md)]">
            {actions}
          </div>
        </Wrap>
      )}
    </div>
  );
};

export default PageHeader;
