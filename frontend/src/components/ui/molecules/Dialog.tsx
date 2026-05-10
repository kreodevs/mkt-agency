import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { forwardRef, type ReactNode, type ComponentPropsWithoutRef } from 'react'

export interface DialogInputProps extends Omit<ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, 'title'> {
  visible?: boolean
  onHide?: () => void
  header?: ReactNode
  footer?: ReactNode
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showClose?: boolean
  children?: ReactNode
}

const sizeStyles: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[90vw] w-full',
}

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
  ) => {
    const sizeClass = sizeStyles[size]

    return (
      <DialogPrimitive.Root
        open={visible}
        onOpenChange={(open) => {
          if (!open) onHide?.()
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200"
          />
          <DialogPrimitive.Content
            ref={ref}
            className={`fixed left-[50%] top-[50%] z-[var(--z-modal)] w-[calc(100%-2rem)] sm:w-full ${sizeClass} translate-x-[-50%] translate-y-[-50%] max-h-[85dvh] overflow-y-auto rounded-[var(--radius-lg)] bg-[var(--card)] border border-[var(--border)] shadow-xl animate-in fade-in zoom-in-95 duration-200 ${className}`}
            {...props}
          >
            {/* Header */}
            {header ? (
              <div className="flex items-start justify-between gap-[var(--spacing-md)] px-[var(--spacing-lg)] py-[var(--spacing-md)] border-b border-[var(--border)]">
                {header}
              </div>
            ) : (
              <div className="flex items-start justify-between gap-[var(--spacing-md)] px-[var(--spacing-lg)] py-[var(--spacing-md)] border-b border-[var(--border)]">
                <div className="flex-1 min-w-0">
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
                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    aria-label="Cerrar"
                  >
                    <X className="w-4 h-4" />
                  </DialogPrimitive.Close>
                )}
              </div>
            )}

            {/* Body */}
            <div className="px-[var(--spacing-lg)] py-[var(--spacing-md)]">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-[var(--spacing-md)] px-[var(--spacing-lg)] py-[var(--spacing-md)] border-t border-[var(--border)] bg-[var(--secondary)]/50">
                {footer}
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    )
  },
)

Dialog.displayName = 'Dialog'

// Alert Dialog variant
export interface AlertDialogProps extends Omit<DialogInputProps, 'footer'> {
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  onCancel?: () => void
  variant?: 'default' | 'destructive'
}

export const AlertDialog = ({
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  onHide,
  variant = 'default',
  ...props
}: AlertDialogProps) => {
  const handleConfirm = () => {
    onConfirm?.()
    onHide?.()
  }

  const handleCancel = () => {
    onCancel?.()
    onHide?.()
  }

  const confirmButtonStyles =
    variant === 'destructive'
      ? 'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]/90'
      : 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]'

  return (
    <Dialog
      title={title}
      description={description}
      size="sm"
      showClose={false}
      onHide={onHide}
      footer={
        <>
          <button
            onClick={handleCancel}
            className="px-[var(--spacing-md)] py-[var(--spacing-sm)] text-sm font-medium rounded-[var(--radius)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-[var(--spacing-md)] py-[var(--spacing-sm)] text-sm font-medium rounded-[var(--radius)] ${confirmButtonStyles} transition-colors`}
          >
            {confirmLabel}
          </button>
        </>
      }
      {...props}
    />
  )
}

export default Dialog
