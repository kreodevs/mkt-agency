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
        className={`overflow-hidden rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card)] ${className}`.trim()}
        {...props}
      >
        {hasHeader && (
          <div className="border-b border-[var(--border)] px-[var(--spacing-md)] py-[var(--spacing-md)]">
            {title && (
              <h3 className="type-ui-sans-medium text-[var(--foreground)]">{title}</h3>
            )}
            {subtitle && (
              <p className="type-detail-xs mt-[var(--spacing-xxs)] text-[var(--foreground-muted)]">
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
