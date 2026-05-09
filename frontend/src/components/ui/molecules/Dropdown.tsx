import { Dropdown as PrimeDropdown, type DropdownProps as PrimeDropdownProps } from 'primereact/dropdown'
import { ChevronDown, Check } from 'lucide-react'
import { forwardRef } from 'react'

export interface DropdownInputProps extends PrimeDropdownProps {
  error?: boolean
  fullWidth?: boolean
}

export const Dropdown = forwardRef<HTMLDivElement, DropdownInputProps>(
  ({ error, fullWidth, className = '', placeholder = 'Seleccionar...', ...props }, ref) => {
    const triggerStyles = `
      flex h-10 items-center justify-between
      rounded-[var(--radius)]
      border border-[var(--input-border)]
      bg-[var(--input)] px-[var(--spacing-md)] py-[var(--spacing-sm)]
      text-sm text-[var(--foreground)]
      transition-all duration-[var(--transition-base)]
      focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:ring-offset-[var(--ring-offset)] focus:border-[var(--input-focus)]
      disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--muted)]
      hover:border-[var(--border-hover)]
      [&[data-p-focus=true]]:ring-2 [&[data-p-focus=true]]:ring-[var(--ring)]
    `

    const errorStyles = error
      ? 'border-[var(--destructive)] focus:ring-[var(--destructive)]'
      : ''

    const widthStyles = fullWidth ? 'w-full' : ''

    const panelStyles = `
      mt-[var(--spacing-xs)] overflow-hidden
      rounded-[var(--radius)]
      border border-[var(--border)]
      bg-[var(--popover)]
      shadow-lg
      z-[var(--z-dropdown)]
    `

    const itemStyles = `
      relative flex items-center justify-between
      px-[var(--spacing-md)] py-[var(--spacing-sm)] text-sm
      text-[var(--foreground)]
      cursor-pointer
      transition-colors duration-[var(--transition-fast)]
      hover:bg-[var(--secondary)]
      focus:bg-[var(--secondary)] focus:outline-none
      data-[p-highlight=true]:bg-[var(--secondary)] data-[p-highlight=true]:text-[var(--accent)]
      data-[p-disabled=true]:pointer-events-none data-[p-disabled=true]:opacity-50
    `

    const emptyStyles = `
      px-[var(--spacing-md)] py-[var(--spacing-lg)] text-center text-sm text-[var(--foreground-muted)]
    `

    return (
      <PrimeDropdown
        ref={ref as any}
        placeholder={placeholder}
        {...props}
        pt={{
          root: {
            className: `${triggerStyles} ${errorStyles} ${widthStyles} ${className}`.trim(),
          },
          input: {
            className: 'flex-1 text-left truncate',
          },
          trigger: {
            className: 'flex items-center justify-center ml-[var(--spacing-sm)]',
          },
          panel: {
            className: panelStyles,
          },
          wrapper: {
            className: 'max-h-60 overflow-auto',
          },
          list: {
            className: 'py-[var(--spacing-xs)]',
          },
          item: {
            className: itemStyles,
          },
          emptyMessage: {
            className: emptyStyles,
          },
          header: {
            className: 'px-[var(--spacing-md)] py-[var(--spacing-sm)] border-b border-[var(--border)]',
          },
          filterInput: {
            className: `
              w-full h-9 rounded-[var(--radius-sm)]
              border border-[var(--input-border)]
              bg-[var(--input)] px-[var(--spacing-md)]
              text-sm text-[var(--foreground)]
              placeholder:text-[var(--foreground-muted)]
              focus:outline-none focus:ring-1 focus:ring-[var(--ring)]
            `,
          },
          filterIcon: {
            className: 'w-4 h-4 text-[var(--foreground-muted)]',
          },
          clearIcon: {
            className: 'w-4 h-4 text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer',
          },
        }}
        dropdownIcon={<ChevronDown className="w-4 h-4 text-[var(--foreground-muted)]" />}
        itemTemplate={(option) => (
          <div className="flex items-center justify-between w-full">
            <span>{option?.label || option}</span>
            {props.value === option?.value && (
              <Check className="w-4 h-4 text-[var(--accent)]" />
            )}
          </div>
        )}
      />
    )
  }
)

Dropdown.displayName = 'Dropdown'

export default Dropdown
