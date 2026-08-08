import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--card)]',
  {
    variants: {
      variant: {
        default: 'border-[var(--card-border)]',
        elevated: 'border-[var(--card-border)] shadow-[var(--shadow-md)]',
        accent:
          'border-[color-mix(in_srgb,var(--brand)_22%,var(--card-border))] shadow-[var(--shadow-sm)]',
        glass: 'material-sheet border-[var(--border)]/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface CardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof cardVariants> {
  title?: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ title, subtitle, footer, variant, className = '', children, ...props }, ref) => {
    const hasHeader = title || subtitle;

    return (
      <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props}>
        {variant === 'accent' && (
          <div className="h-1 w-full bg-[var(--gradient-brand)]" aria-hidden />
        )}
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
