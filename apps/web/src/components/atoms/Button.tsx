import { Loader2 } from 'lucide-react';
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

function getAsChildElement(children: ReactNode): ReactElement {
  if (isValidElement(children)) {
    return children;
  }
  const elements = Children.toArray(children).filter(isValidElement);
  if (elements.length === 1) {
    return elements[0];
  }
  throw new Error('Button with asChild expects a single React element child.');
}

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-[var(--spacing-sm)] font-medium rounded-[var(--radius)] transition-all duration-[var(--transition-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)] disabled:pointer-events-none disabled:cursor-not-allowed motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] shadow-sm active:scale-[0.98] disabled:bg-[var(--muted)] disabled:text-[var(--foreground-muted)]',
        secondary:
          'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--muted)] border border-[var(--border)] active:scale-[0.98] disabled:bg-[var(--muted)] disabled:text-[var(--foreground-muted)] disabled:border-[var(--border)]',
        outline:
          'border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--secondary)] hover:border-[var(--border-hover)] active:scale-[0.98] disabled:bg-[var(--muted)] disabled:text-[var(--foreground-muted)] disabled:border-[var(--border)]',
        ghost:
          'bg-transparent text-[var(--foreground)] hover:bg-[var(--secondary)] active:scale-[0.98] disabled:bg-transparent disabled:text-[var(--foreground-muted)]',
        destructive:
          'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]/90 shadow-sm active:scale-[0.98] disabled:bg-[var(--muted)] disabled:text-[var(--foreground-muted)]',
        link:
          'bg-transparent text-[var(--primary)] kreo-underline-draw underline-offset-4 hover:no-underline disabled:text-[var(--foreground-muted)] disabled:no-underline',
        tactile: [
          'bg-[var(--brand)] text-[var(--brand-foreground)]',
          'shadow-[0_5px_0_0_var(--brand-deep)]',
          'hover:opacity-95',
          'active:translate-y-[5px] active:shadow-[0_1px_0_0_var(--brand-deep)]',
          'transition-[transform,box-shadow,background-color,opacity]',
          '[transition-duration:var(--press-fast)]',
          'motion-reduce:active:translate-y-0',
        ].join(' '),
        brand:
          'border border-transparent bg-[var(--brand)] text-[var(--brand-foreground)] shadow-[var(--shadow-sm)] [background-image:var(--gradient-brand)] hover:opacity-95 active:scale-[0.98] disabled:pointer-events-none disabled:border-[color-mix(in_srgb,var(--brand)_35%,var(--border))] disabled:bg-[var(--brand-muted)] disabled:[background-image:none] disabled:text-[var(--brand-deep)] disabled:shadow-none disabled:opacity-100 disabled:hover:opacity-100',
        action:
          'border border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-fg)] hover:bg-[var(--action-bg-hover)] hover:border-[var(--action-border-hover)] hover:text-[var(--action-fg-hover)] active:border-[var(--action-border-hover)] active:text-[var(--action-fg-hover)] active:scale-[0.98] disabled:bg-[var(--muted)] disabled:text-[var(--foreground-muted)] disabled:border-[var(--border)]',
        'action-primary':
          'border border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-primary-fg)] hover:bg-[var(--action-primary-bg-hover)] hover:border-[var(--action-primary-border-hover)] active:border-[var(--action-primary-border-hover)] active:scale-[0.98] disabled:bg-[var(--muted)] disabled:text-[var(--foreground-muted)] disabled:border-[var(--border)]',
        'action-selected':
          'border border-[var(--action-border-selected)] bg-[var(--action-bg-selected)] text-[var(--action-fg-selected)] hover:bg-[var(--primary-hover)] hover:border-[var(--primary-hover)] hover:text-[var(--action-fg-selected)] disabled:bg-[var(--muted)] disabled:text-[var(--foreground-muted)] disabled:border-[var(--border)]',
        'action-destructive':
          'border border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-destructive-fg)] hover:bg-[var(--action-destructive-bg-hover)] hover:border-[var(--action-destructive-border-hover)] active:scale-[0.98] disabled:bg-[var(--muted)] disabled:text-[var(--foreground-muted)] disabled:border-[var(--border)]',
        'action-success':
          'border border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-success-fg)] hover:bg-[var(--action-success-bg-hover)] hover:border-[var(--action-success-border-hover)] active:scale-[0.98] disabled:bg-[var(--muted)] disabled:text-[var(--foreground-muted)] disabled:border-[var(--border)]',
        'action-danger':
          'border border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-danger-fg)] hover:bg-[var(--action-danger-bg-hover)] hover:border-[var(--action-danger-border-hover)] active:scale-[0.98] disabled:bg-[var(--muted)] disabled:text-[var(--foreground-muted)] disabled:border-[var(--border)]',
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
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, loading, disabled, asChild = false, children, className, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }));

    if (asChild) {
      const child = getAsChildElement(children);
      return cloneElement(child, {
        ...props,
        className: cn(classes, child.props.className),
        ref,
      });
    }

    return (
      <button ref={ref} disabled={disabled || loading} className={classes} {...props}>
        {loading && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { buttonVariants };
export default Button;
