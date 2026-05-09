import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

export interface DialogInputProps {
  visible?: boolean
  onHide?: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showClose?: boolean
  footer?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

const sizeStyles: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[95vw] sm:max-w-[90vw] w-full',
}

export const Dialog = ({
  visible = false,
  onHide,
  title,
  description,
  size = 'md',
  showClose = true,
  footer,
  children,
  className = '',
}: DialogInputProps) => {
  return (
    <DialogPrimitive.Root open={visible} onOpenChange={(open) => { if (!open) onHide?.() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[var(--z-modal)] bg-black/60 backdrop-blur-sm
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          className={`fixed left-1/2 top-1/2 z-[calc(var(--z-modal)+1)] w-full ${sizeStyles[size]}
            -translate-x-1/2 -translate-y-1/2
            rounded-[var(--radius-lg)] bg-[var(--card)] border border-[var(--border)] shadow-xl
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
            data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
            data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]
            data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]
            max-h-[85vh] overflow-y-auto
            ${className}`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-[var(--spacing-md)] px-[var(--spacing-lg)] py-[var(--spacing-md)] border-b border-[var(--border)]">
            <div className="flex-1 min-w-0">
              {title && (
                <DialogPrimitive.Title className="text-lg font-semibold text-[var(--foreground)]">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <p className="mt-[var(--spacing-xs)] text-sm text-[var(--foreground-muted)]">
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <DialogPrimitive.Close className="p-1.5 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
                <X className="w-4 h-4" />
              </DialogPrimitive.Close>
            )}
          </div>

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
}

Dialog.displayName = 'Dialog'

export default Dialog
