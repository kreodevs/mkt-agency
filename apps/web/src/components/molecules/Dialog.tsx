import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { forwardRef, useCallback, useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

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
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  full: 'sm:max-w-[90vw]',
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
      onPointerDownOutside,
      onFocusOutside,
      onInteractOutside,
      ...props
    },
    ref,
  ) => {
    const touchStartY = useRef(0);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    }, []);

    const handleTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        if (dy > 80) {
          onHide?.();
        }
      },
      [onHide],
    );

    return (
    <DialogPrimitive.Root
      open={visible}
      onOpenChange={(open) => {
        if (!open) onHide?.();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-modal)] animate-in fade-in duration-200 bg-[var(--foreground)]/30 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          ref={ref}
          data-dialog-content
          className={`fixed z-[var(--z-modal)] flex max-h-[90dvh] w-[95vw] flex-col overflow-visible material-sheet rounded-t-[var(--radius-lg)] rounded-b-none sm:rounded-[var(--radius-lg)] border border-[var(--border)]/60 shadow-xl
            bottom-0 left-0 right-0
            sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
            data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:duration-300
            data-[state=open]:slide-in-from-bottom-2 sm:data-[state=open]:slide-in-from-bottom-2
            data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:duration-200
            data-[state=closed]:slide-out-to-bottom-1 sm:data-[state=closed]:slide-out-to-bottom-1
            ${sizeStyles[size]} ${className}`}
          style={{ paddingBottom: 'max(var(--safe-area-bottom), 0px)' }}
          onPointerDownOutside={(event) => {
            onPointerDownOutside?.(event);
            if (event.defaultPrevented) {
              return;
            }
            const target = event.target as HTMLElement;
            if (target.closest('[data-llm-model-listbox]')) {
              event.preventDefault();
            }
          }}
          onFocusOutside={(event) => {
            onFocusOutside?.(event);
            if (event.defaultPrevented) {
              return;
            }
            const target = event.target as HTMLElement;
            if (target.closest('[data-llm-model-listbox]')) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            onInteractOutside?.(event);
            if (event.defaultPrevented) {
              return;
            }
            const target = event.target as HTMLElement;
            if (target.closest('[data-llm-model-listbox]')) {
              event.preventDefault();
            }
          }}
          {...props}
        >
          {/* Drag handle for bottom sheet on mobile */}
          <div
            className="flex items-center justify-center py-2 sm:hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
          </div>

          {header ? (
            <div className="flex items-start justify-between gap-[var(--spacing-md)] border-b border-[var(--border)]/60 px-[var(--spacing-lg)] py-[var(--spacing-md)]">
              {header}
            </div>
          ) : (
            <div className="flex items-start justify-between gap-[var(--spacing-md)] border-b border-[var(--border)]/60 px-[var(--spacing-lg)] py-[var(--spacing-md)]">
              <div className="min-w-0 flex-1">
                {title && (
                  <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
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
                  className="rounded-[var(--radius-sm)] p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)] press-subtle"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </DialogPrimitive.Close>
              )}
            </div>
          )}

          <div ref={contentRef} className="rubber-band min-h-0 flex-1 overflow-y-auto px-[var(--spacing-lg)] py-[var(--spacing-md)]">
            {children}
          </div>

          {footer && (
            <div className="flex items-center justify-end gap-[var(--spacing-md)] border-t border-[var(--border)]/60 bg-[var(--secondary)]/50 px-[var(--spacing-lg)] py-[var(--spacing-md)] pb-[max(var(--safe-area-bottom),var(--spacing-md))]">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
    );
  },
);

Dialog.displayName = 'Dialog';
export default Dialog;
