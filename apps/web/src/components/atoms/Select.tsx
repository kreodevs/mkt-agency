import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      hint,
      error,
      options,
      placeholder,
      fullWidth = true,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('flex flex-col gap-[var(--spacing-xs)]', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-[var(--foreground)]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-control-md min-h-control-md rounded-[var(--radius)] border border-[var(--input-border)] bg-[var(--input)] px-[var(--spacing-md)] text-sm text-[var(--foreground)] shadow-sm transition-colors',
            'focus-visible:border-[var(--input-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[var(--destructive)]',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {hint && !error && (
          <p className="text-xs text-[var(--foreground-subtle)]">{hint}</p>
        )}
        {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
export default Select;
