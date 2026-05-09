// REGISTRY: Checkbox

import { Checkbox as PrimeCheckbox, type CheckboxProps as PrimeCheckboxProps } from 'primereact/checkbox'
import { Check } from 'lucide-react'
import { forwardRef } from 'react'

export interface CheckboxInputProps extends Omit<PrimeCheckboxProps, 'pt'> {
  label?: string
  error?: boolean
  description?: string
}

export const Checkbox = forwardRef<HTMLDivElement, CheckboxInputProps>(
  ({ label, error, description, className = '', checked, ...props }, ref) => {
    const boxStyles = `
      peer h-5 w-5 shrink-0 rounded-[var(--radius-sm)]
      border border-[var(--input-border)]
      bg-[var(--input)]
      transition-all duration-[var(--transition-base)]
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)]
      disabled:cursor-not-allowed disabled:opacity-50
      data-[p-highlight=true]:bg-[var(--primary)] data-[p-highlight=true]:border-[var(--primary)]
      hover:border-[var(--border-hover)]
    `

    const errorStyles = error
      ? 'border-[var(--destructive)]'
      : ''

    const iconStyles = `
      w-3.5 h-3.5 text-[var(--primary-foreground)]
    `

    return (
      <div ref={ref} className={`flex items-start gap-[var(--spacing-md)] ${className}`}>
        <PrimeCheckbox
          checked={checked}
          {...props}
          pt={{
            root: {
              className: 'relative flex items-center justify-center',
            },
            input: {
              className: `${boxStyles} ${errorStyles}`.trim(),
            },
            icon: {
              className: iconStyles,
            },
            box: {
              className: 'hidden',
            },
          }}
          icon={<Check className={iconStyles} strokeWidth={3} />}
        />
        {(label || description) && (
          <div className="grid gap-[var(--spacing-xs)] leading-none">
            {label && (
              <label className="text-sm font-medium text-[var(--foreground)] cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-[var(--foreground-muted)]">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export default Checkbox
