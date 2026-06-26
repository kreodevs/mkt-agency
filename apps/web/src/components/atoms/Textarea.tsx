import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[60px] w-full rounded-[var(--radius)] border border-[var(--input-border)] bg-[var(--input)] px-[var(--spacing-md)] py-[var(--spacing-sm)] text-sm text-[var(--foreground)] shadow-sm transition-colors duration-[var(--transition-base)] placeholder:text-[var(--foreground-muted)] focus-visible:border-[var(--input-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:bg-[var(--muted)] disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';
export default Textarea;
