import { Loader2 } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-[var(--spacing-sm)] font-medium rounded-[var(--radius)] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] active:transition-transform active:duration-[80ms] will-change-transform',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]',
        secondary:
          'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--muted)] border border-[var(--border)]',
        outline:
          'border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--secondary)] hover:border-[var(--border-hover)]',
        ghost:
          'bg-transparent text-[var(--foreground)] hover:bg-[var(--secondary)]',
        destructive:
          'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]/90',
        link: 'bg-transparent text-[var(--primary)] hover:underline underline-offset-4',
        action:
          'border border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-fg)] hover:bg-[var(--action-bg-hover)] hover:border-[var(--action-border-hover)] hover:text-[var(--action-fg-hover)] active:border-[var(--action-border-hover)] active:text-[var(--action-fg-hover)]',
        'action-primary':
          'border border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-primary-fg)] hover:bg-[var(--action-primary-bg-hover)] hover:border-[var(--action-primary-border-hover)] active:border-[var(--action-primary-border-hover)]',
        'action-selected':
          'border border-[var(--action-border-selected)] bg-[var(--action-bg-selected)] text-[var(--action-fg-selected)] hover:bg-[var(--primary-hover)] hover:border-[var(--primary-hover)] hover:text-[var(--action-fg-selected)]',
        'action-destructive':
          'border border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-destructive-fg)] hover:bg-[var(--action-destructive-bg-hover)] hover:border-[var(--action-destructive-border-hover)]',
        'action-success':
          'border border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-success-fg)] hover:bg-[var(--action-success-bg-hover)] hover:border-[var(--action-success-border-hover)]',
        'action-danger':
          'border border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-danger-fg)] hover:bg-[var(--action-danger-bg-hover)] hover:border-[var(--action-danger-border-hover)]',
      },
      size: {
        default: 'h-control-md min-h-control-md px-[var(--spacing-md)] text-sm',
        sm: 'h-control-sm min-h-control-sm px-[var(--spacing-md)] text-xs',
        lg: 'h-control-lg min-h-control-lg px-[var(--spacing-lg)] text-base',
        icon: 'h-control-icon min-h-control-icon w-control-icon p-0',
        action:
          'h-action min-h-action w-action min-w-action p-0 [&_svg]:h-action-icon [&_svg]:w-action-icon [&_svg]:shrink-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends ComponentPropsWithoutRef<'button'>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, loading, disabled, children, className, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
);

Button.displayName = 'Button';

export { buttonVariants };
export default Button;
