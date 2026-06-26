import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState, type ComponentPropsWithoutRef } from 'react';

export interface PasswordInputProps extends ComponentPropsWithoutRef<'input'> {
  error?: boolean;
}

export const Password = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, className = '', ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const ToggleIcon = visible ? EyeOff : Eye;

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={[
            'flex h-10 w-full rounded-[var(--radius)]',
            'border border-[var(--input-border)]',
            'bg-[var(--input)] px-[var(--spacing-md)] py-[var(--spacing-sm)] pr-[var(--spacing-2xl)]',
            'text-sm text-[var(--foreground)]',
            'placeholder:text-[var(--foreground-muted)]',
            'transition-all duration-[var(--transition-base)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:ring-offset-[var(--ring-offset)] focus:border-[var(--input-focus)]',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--muted)]',
            error ? 'border-[var(--destructive)] focus:ring-[var(--destructive)]' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          tabIndex={-1}
          className="absolute right-4 top-1/2 flex h-4 w-4 -translate-y-1/2 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <ToggleIcon className="h-4 w-4" />
        </button>
      </div>
    );
  },
);

Password.displayName = 'Password';
export default Password;
