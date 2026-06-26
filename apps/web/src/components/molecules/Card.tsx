import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ title, subtitle, footer, className = '', children, ...props }, ref) => {
    const hasHeader = title || subtitle;

    return (
      <div
        ref={ref}
        className={`overflow-hidden rounded-[var(--radius-md)] border border-[var(--card-border)] bg-[var(--card)] shadow-sm ${className}`.trim()}
        {...props}
      >
        {hasHeader && (
          <div className="border-b border-[var(--border)] px-[var(--spacing-md)] py-[var(--spacing-md)]">
            {title && (
              <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-[var(--spacing-xxs)] text-sm text-[var(--foreground-muted)]">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children && (
          <div className="px-[var(--spacing-md)] py-[var(--spacing-md)]">{children}</div>
        )}
        {footer && (
          <div className="border-t border-[var(--border)] px-[var(--spacing-md)] py-[var(--spacing-md)]">
            {footer}
          </div>
        )}
      </div>
    );
  },
);

Card.displayName = 'Card';
export default Card;
