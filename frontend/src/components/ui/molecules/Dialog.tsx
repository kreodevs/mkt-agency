import { Dialog as PrimeDialog, type DialogProps as PrimeDialogProps } from 'primereact/dialog'
import { X } from 'lucide-react'
import { forwardRef, type ReactNode } from 'react'

export interface DialogInputProps extends Omit<PrimeDialogProps, 'pt'> {
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showClose?: boolean
  footer?: ReactNode
  children?: ReactNode
}

const sizeStyles: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[90vw] w-full',
}

export const Dialog = forwardRef<PrimeDialog, DialogInputProps>(
  ({
    title,
    description,
    size = 'md',
    showClose = true,
    footer,
    children,
    visible,
    onHide,
    className = '',
    ...props
  }, ref) => {

    const ptStyles = {
      root: {
        className: `
          fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-[var(--spacing-md)]
        `,
      },
      mask: {
        className: `
          fixed inset-0 bg-black/60 backdrop-blur-sm
          transition-opacity duration-200
          data-[state=entering]:animate-fade-in
        `,
      },
      content: {
        className: `
          relative w-full ${sizeStyles[size]}
          rounded-[var(--radius-lg)] 
          bg-[var(--card)] border border-[var(--border)]
          shadow-xl
          animate-slide-in
          ${className}
        `.trim(),
      },
      header: {
        className: `
          flex items-start justify-between gap-[var(--spacing-md)]
          px-[var(--spacing-lg)] py-[var(--spacing-md)]
          border-b border-[var(--border)]
        `,
      },
      headerTitle: {
        className: 'text-lg font-semibold text-[var(--foreground)]',
      },
      headerIcons: {
        className: 'flex items-center gap-[var(--spacing-sm)]',
      },
      closeButton: {
        className: `
          p-1.5 rounded-[var(--radius-sm)]
          text-[var(--foreground-muted)]
          hover:text-[var(--foreground)] hover:bg-[var(--secondary)]
          transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
        `,
      },
      closeButtonIcon: {
        className: 'w-4 h-4',
      },
      footer: {
        className: `
          flex items-center justify-end gap-[var(--spacing-md)]
          px-[var(--spacing-lg)] py-[var(--spacing-md)]
          border-t border-[var(--border)]
          bg-[var(--secondary)]/50
        `,
      },
    }

    const headerTemplate = () => (
      <div className={ptStyles.header.className}>
        <div className="flex-1 min-w-0">
          {title && <h2 className={ptStyles.headerTitle.className}>{title}</h2>}
          {description && (
            <p className="mt-[var(--spacing-xs)] text-sm text-[var(--foreground-muted)]">{description}</p>
          )}
        </div>
        {showClose && (
          <button
            onClick={onHide}
            className={ptStyles.closeButton.className}
            aria-label="Cerrar"
          >
            <X className={ptStyles.closeButtonIcon.className} />
          </button>
        )}
      </div>
    )

    const footerTemplate = () => {
      if (!footer) return null
      return <div className={ptStyles.footer.className}>{footer}</div>
    }

    return (
      <PrimeDialog
        ref={ref}
        visible={visible}
        onHide={onHide}
        modal
        draggable={false}
        resizable={false}
        header={headerTemplate}
        footer={footerTemplate}
        closeOnEscape
        dismissableMask
        {...props}
        pt={{
          root: { className: ptStyles.root.className },
          mask: { className: ptStyles.mask.className },
          content: { className: `${ptStyles.content.className} overflow-hidden` },
          header: { className: 'hidden' },
          footer: { className: 'hidden' },
        }}
      >
        <div className="px-[var(--spacing-lg)] py-[var(--spacing-md)]">
          {children}
        </div>
      </PrimeDialog>
    )
  }
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

  const confirmButtonStyles = variant === 'destructive'
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
