import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

export interface DialogInputProps
  extends Omit<ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, 'title'> {
  visible?: boolean;
  onHide?: () => void;
  header?: ReactNode;
  footer?: ReactNode;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  children?: ReactNode;
}

const sizeStyles: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[90vw] w-full',
};

export const Dialog = forwardRef<HTMLDivElement, DialogInputProps>(
  (
    {
      title,
      description,
      size = 'md',
      showClose = true,
      header,
      footer,
      children,
      visible,
      onHide,
      className = '',
      ...props
    },
    ref,
  ) => (
    <DialogPrimitive.Root
      open={visible}
      onOpenChange={(open) => {
        if (!open) onHide?.();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-modal)] bg-[var(--background)]/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          ref={ref}
          className={`fixed left-1/2 top-1/2 z-[var(--z-modal)] max-h-[90vh] w-full -translate-x-1/2 -translate-y-1/2 overflow-y-auto ${sizeStyles[size]} rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-xl ${className}`}
          {...props}
        >
          {header ? (
            <div className="flex items-start justify-between gap-[var(--spacing-md)] border-b border-[var(--border)] px-[var(--spacing-lg)] py-[var(--spacing-md)]">
              {header}
            </div>
          ) : (
            <div className="flex items-start justify-between gap-[var(--spacing-md)] border-b border-[var(--border)] px-[var(--spacing-lg)] py-[var(--spacing-md)]">
              <div className="min-w-0 flex-1">
                {title && (
                  <DialogPrimitive.Title className="text-lg font-semibold text-[var(--foreground)]">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description && (
                  <DialogPrimitive.Description className="mt-[var(--spacing-xs)] text-sm text-[var(--foreground-muted)]">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              {showClose && (
                <DialogPrimitive.Close
                  className="rounded-[var(--radius-sm)] p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </DialogPrimitive.Close>
              )}
            </div>
          )}

          <div className="px-[var(--spacing-lg)] py-[var(--spacing-md)]">{children}</div>

          {footer && (
            <div className="flex items-center justify-end gap-[var(--spacing-md)] border-t border-[var(--border)] bg-[var(--secondary)]/50 px-[var(--spacing-lg)] py-[var(--spacing-md)]">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  ),
);

Dialog.displayName = 'Dialog';
export default Dialog;
