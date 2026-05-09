import { InputText as PrimeInputText } from 'primereact/inputtext'
import type { InputTextProps as PrimeInputTextProps } from 'primereact/inputtext'
import { forwardRef } from 'react'

export interface InputTextProps extends Omit<PrimeInputTextProps, 'pt'> {
  error?: boolean
  fullWidth?: boolean
}

export const InputText = forwardRef<HTMLInputElement, InputTextProps>(
  ({ error, fullWidth, className = '', ...props }, ref) => {
    const baseStyles = `
      flex h-10 w-full rounded-[var(--radius)]
      border border-[var(--input-border)]
      bg-[var(--input)] px-3 py-2
      text-sm text-[var(--foreground)]
      placeholder:text-[var(--foreground-muted)]
      transition-all duration-[var(--transition-base)]
      focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:ring-offset-[var(--ring-offset)] focus:border-[var(--input-focus)]
      disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--muted)]
      file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--foreground)]
    `

    const errorStyles = error
      ? 'border-[var(--destructive)] focus:ring-[var(--destructive)]'
      : ''

    const widthStyles = fullWidth ? 'w-full' : ''

    return (
      <PrimeInputText
        ref={ref}
        {...props}
        pt={{
          root: {
            className: `${baseStyles} ${errorStyles} ${widthStyles} ${className}`.trim(),
          },
        }}
      />
    )
  }
)

InputText.displayName = 'InputText'

export default InputText
