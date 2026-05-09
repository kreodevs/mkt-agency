// REGISTRY: MultiSelect

import { MultiSelect as PrimeMultiSelect, type MultiSelectProps as PrimeMultiSelectProps } from 'primereact/multiselect'
import { ChevronDown, Check, X } from 'lucide-react'
import { forwardRef } from 'react'

export interface MultiSelectInputProps extends Omit<PrimeMultiSelectProps, 'pt'> {
  error?: boolean
  fullWidth?: boolean
}

export const MultiSelect = forwardRef<any, MultiSelectInputProps>(
  ({ error, fullWidth, className = '', placeholder = 'Seleccionar...', ...props }, ref) => {
    const triggerStyles = `
      flex min-h-10 items-center justify-between
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
      relative flex items-center gap-[var(--spacing-sm)]
      px-[var(--spacing-md)] py-[var(--spacing-sm)] text-sm
      text-[var(--foreground)]
      cursor-pointer
      transition-colors duration-[var(--transition-fast)]
      hover:bg-[var(--secondary)]
      focus:bg-[var(--secondary)] focus:outline-none
      data-[p-highlight=true]:bg-[var(--secondary)]
      data-[p-disabled=true]:pointer-events-none data-[p-disabled=true]:opacity-50
    `

    const chipStyles = `
      inline-flex items-center gap-[var(--spacing-xs)]
      px-[var(--spacing-sm)] py-[var(--spacing-xxs)] mr-[var(--spacing-xs)] mb-[var(--spacing-xs)]
      text-xs font-medium
      rounded-[var(--radius-sm)]
      bg-[var(--secondary)] text-[var(--foreground)]
      border border-[var(--border)]
    `

    const checkboxStyles = `
      flex items-center justify-center
      !w-4 !h-4 !rounded-[var(--radius-sm)]
      !border !border-[var(--input-border)]
      !bg-[var(--input)]
      !transition-all !duration-[var(--transition-fast)]
      data-[p-highlight=true]:!bg-[var(--primary)] data-[p-highlight=true]:!border-[var(--primary)]
      hover:!border-[var(--border-hover)]
    `

    const emptyStyles = `
      px-[var(--spacing-md)] py-[var(--spacing-lg)] text-center text-sm text-[var(--foreground-muted)]
    `

    return (
      <PrimeMultiSelect
        ref={ref}
        placeholder={placeholder}
        display="chip"
        {...props}
        pt={{
          root: {
            className: `${triggerStyles} ${errorStyles} ${widthStyles} ${className}`.trim(),
          },
          labelContainer: {
            className: 'flex-1 flex flex-wrap items-center gap-[var(--spacing-xs)]',
          },
          label: {
            className: 'text-[var(--foreground-muted)]',
          },
          trigger: {
            className: 'flex items-center justify-center ml-[var(--spacing-sm)] shrink-0',
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
          checkboxContainer: {
            className: 'mr-[var(--spacing-sm)]',
          },
          checkbox: {
            root: { className: '!relative !flex !items-center !justify-center' },
            box: { className: checkboxStyles },
            input: { className: '!hidden' },
            icon: { className: '!w-3 !h-3 !text-[var(--primary-foreground)]' }
          },
          token: {
            className: chipStyles,
          },
          tokenLabel: {
            className: 'text-xs',
          },
          removeTokenIcon: {
            className: '!w-3 !h-3 !text-[var(--foreground-muted)] hover:!text-[var(--foreground)] !cursor-pointer !ml-1',
          },
          emptyMessage: {
            className: emptyStyles,
          },
          header: {
            className: 'px-[var(--spacing-md)] py-[var(--spacing-sm)] border-b border-[var(--border)] flex items-center gap-[var(--spacing-sm)]',
          },
          headerCheckboxContainer: {
            className: 'mr-[var(--spacing-sm)]',
          },
          headerCheckbox: {
            root: { className: '!relative !flex !items-center !justify-center' },
            box: { className: checkboxStyles },
            input: { className: '!hidden' },
            icon: { className: '!w-3 !h-3 !text-[var(--primary-foreground)]' }
          },
          filterInput: {
            className: `
              flex-1 h-9 rounded-[var(--radius-sm)]
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
          closeButton: {
            className: `
              p-[var(--spacing-xs)] rounded-[var(--radius-sm)]
              text-[var(--foreground-muted)]
              hover:text-[var(--foreground)] hover:bg-[var(--secondary)]
              transition-colors
            `,
          },
        }}
        dropdownIcon={<ChevronDown className="w-4 h-4 text-[var(--foreground-muted)]" />}
        removeIcon={<X className="w-3 h-3" />}
        checkboxIcon={<Check className="w-3 h-3" strokeWidth={3} />}
      />
    )
  }
)

MultiSelect.displayName = 'MultiSelect'

export default MultiSelect
