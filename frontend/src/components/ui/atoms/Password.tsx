import { Password as PrimePassword, type PasswordProps as PrimePasswordProps } from 'primereact/password'
import { Eye, EyeOff } from 'lucide-react'
import { forwardRef } from 'react'

export interface PasswordInputProps extends Omit<PrimePasswordProps, 'pt'> {
  error?: boolean
  fullWidth?: boolean
  showStrength?: boolean
}

export const Password = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, fullWidth, showStrength = false, className = '', ...props }, ref) => {
    const inputStyles = `
      flex h-10 w-full rounded-[var(--radius)]
      border border-[var(--input-border)]
      bg-[var(--input)] px-3 py-2 pr-10
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

    const panelStyles = `
      mt-2 p-4 rounded-[var(--radius)]
      bg-[var(--popover)] border border-[var(--border)]
      shadow-lg
    `

    const meterStyles = `
      h-2 rounded-full bg-[var(--muted)] overflow-hidden mt-2
    `

    const meterLabelStyles = `
      text-xs text-[var(--foreground-muted)] mt-1
    `

    return (
      <div className={`relative ${widthStyles}`}>
        <PrimePassword
          ref={ref as any}
          feedback={showStrength}
          toggleMask
          showIcon={<Eye className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] transition-colors" />}
          hideIcon={<EyeOff className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] transition-colors" />}
          {...props}
          pt={{
            root: {
              className: `relative ${widthStyles} ${className}`.trim(),
            },
            input: {
              className: `${inputStyles} ${errorStyles}`.trim(),
            },
            showIcon: {
              className: 'absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer',
            },
            hideIcon: {
              className: 'absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer',
            },
            panel: {
              className: panelStyles,
            },
            meter: {
              className: meterStyles,
            },
            meterLabel: {
              className: meterLabelStyles,
            },
            info: {
              className: 'text-xs text-[var(--foreground-muted)] mt-2',
            },
          }}
          promptLabel="Ingresa una contraseña"
          weakLabel="Débil"
          mediumLabel="Media"
          strongLabel="Fuerte"
        />
      </div>
    )
  }
)

Password.displayName = 'Password'

export default Password
