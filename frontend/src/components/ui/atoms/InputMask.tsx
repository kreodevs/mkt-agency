import { IMaskInput } from 'react-imask'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'

export interface InputMaskProps extends Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'onChange'> {
  mask?: string
  error?: boolean
  fullWidth?: boolean
  value?: string
  onChange?: (value: string) => void
}

export const InputMask = forwardRef<HTMLInputElement, InputMaskProps>(
  ({ error, fullWidth, className = '', mask, value, onChange, ...props }, ref) => {
    const baseStyles = `
      flex h-10 w-full rounded-[var(--radius)]
      border border-[var(--input-border)]
      bg-[var(--input)] px-[var(--spacing-md)] py-[var(--spacing-sm)]
      text-sm text-[var(--foreground)]
      placeholder:text-[var(--foreground-muted)]
      transition-all duration-[var(--transition-base)]
      focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:ring-offset-[var(--ring-offset)] focus:border-[var(--input-focus)]
      disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--muted)]
    `

    const errorStyles = error
      ? 'border-[var(--destructive)] focus:ring-[var(--destructive)]'
      : ''

    const widthStyles = fullWidth ? 'w-full' : ''

    return (
      <IMaskInput
        ref={ref}
        mask={mask}
        value={value}
        onAccept={(value: string) => onChange?.(value)}
        className={`${baseStyles} ${errorStyles} ${widthStyles} ${className}`.trim()}
        {...props}
      />
    )
  }
)

InputMask.displayName = 'InputMask'

export default InputMask
