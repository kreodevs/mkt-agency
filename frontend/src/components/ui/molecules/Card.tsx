import { type CardProps as PrimeCardProps } from 'primereact/card'
import { forwardRef, type ReactNode } from 'react'

export interface CardInputProps extends Omit<PrimeCardProps, 'pt'> {
  variant?: 'default' | 'bordered' | 'elevated' | 'ghost'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
  header?: ReactNode
  footer?: ReactNode
  headerActions?: ReactNode
  contentClassName?: string
  children?: ReactNode
}

const variantStyles: Record<string, string> = {
  default: 'bg-[var(--card)] border border-[var(--card-border)]',
  bordered: 'bg-transparent border-2 border-[var(--border)]',
  elevated: 'bg-[var(--card)] border border-[var(--card-border)] shadow-lg',
  ghost: 'bg-transparent border-none',
}

const paddingStyles: Record<string, { header: string; content: string; footer: string }> = {
  none: { header: 'p-0', content: 'p-0', footer: 'p-0' },
  sm: { header: 'px-3 py-2', content: 'px-3 py-2', footer: 'px-3 py-2' },
  md: { header: 'px-4 py-3', content: 'px-4 py-3', footer: 'px-4 py-3' },
  lg: { header: 'px-6 py-4', content: 'px-6 py-4', footer: 'px-6 py-4' },
}

export const Card = forwardRef<HTMLDivElement, CardInputProps>(
  ({
    variant = 'default',
    padding = 'md',
    hoverable = false,
    header,
    footer,
    headerActions,
    contentClassName,
    children,
    title,
    subTitle,
    className = '',
  }, _ref) => {
    const baseStyles = `
      rounded-[var(--radius)]
      transition-all duration-[var(--transition-base)]
      overflow-hidden
    `

    const hoverStyles = hoverable
      ? 'hover:border-[var(--accent)] hover:shadow-gold cursor-pointer'
      : ''

    const padStyles = paddingStyles[padding]

    const renderHeader = () => {
      if (!header && !title && !headerActions) return null

      return (
        <div className={`flex items-start justify-between gap-4 border-b border-[var(--border)] ${padStyles.header}`}>
          <div className="flex-1 min-w-0">
            {header || (
              <>
                {title && (
                  <h3 className="text-lg font-semibold text-[var(--foreground)] truncate">
                    {title as any}
                  </h3>
                )}
                {subTitle && (
                  <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                    {subTitle as any}
                  </p>
                )}
              </>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      )
    }

    const renderFooter = () => {
      if (!footer) return null

      return (
        <div className={`border-t border-[var(--border)] ${padStyles.footer}`}>
          {footer}
        </div>
      )
    }

    return (
      <div
        ref={_ref}
        className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`.trim()}
      >
        {renderHeader()}
        <div className={`${padStyles.content} ${contentClassName || ''}`.trim()}>
          {children}
        </div>
        {renderFooter()}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Simple Card subcomponents for flexibility
export const CardHeader = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`px-4 py-3 border-b border-[var(--border)] ${className}`}>
    {children}
  </div>
)

export const CardContent = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`px-4 py-3 ${className}`}>
    {children}
  </div>
)

export const CardFooter = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`px-4 py-3 border-t border-[var(--border)] ${className}`}>
    {children}
  </div>
)

export const CardTitle = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-[var(--foreground)] ${className}`}>
    {children}
  </h3>
)

export const CardDescription = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <p className={`text-sm text-[var(--foreground-muted)] ${className}`}>
    {children}
  </p>
)

export default Card
