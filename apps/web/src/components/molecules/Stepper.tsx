import { forwardRef, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepperItem {
  label: string;
  description?: string;
  icon?: ReactNode;
}

export interface StepperProps {
  model: StepperItem[];
  activeIndex?: number;
  readOnly?: boolean;
  onSelect?: (e: { index: number; item: StepperItem }) => void;
  className?: string;
}

export const Stepper = forwardRef<HTMLDivElement, StepperProps>(
  ({ model, activeIndex = 0, readOnly = true, onSelect, className }, ref) => (
    <div ref={ref} className={cn('w-full py-[var(--spacing-lg)]', className)}>
      <div className="relative flex w-full items-start justify-between overflow-x-auto">
        {model.map((item, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const isPending = index > activeIndex;
          const isLast = index === model.length - 1;

          return (
            <div
              key={index}
              className={cn(
                'group relative flex w-full min-w-[72px] flex-col items-center',
                !readOnly && 'cursor-pointer',
              )}
              onClick={() => {
                if (!readOnly && onSelect) onSelect({ index, item });
              }}
            >
              {!isLast && (
                <div className="absolute left-[50%] top-5 z-0 h-[2px] w-full">
                  <div
                    className={cn(
                      'h-full transition-all duration-500',
                      isCompleted
                        ? 'bg-[var(--primary)] opacity-70'
                        : 'bg-[var(--border)]',
                    )}
                  />
                </div>
              )}

              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-[var(--background)] text-sm font-bold transition-all duration-500',
                  isActive &&
                    'scale-110 border-[var(--primary)] text-[var(--primary)] shadow-lg ring-4 ring-[var(--primary)]/10',
                  isCompleted &&
                    'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]',
                  isPending &&
                    'border-[var(--border)] text-[var(--foreground-muted)]',
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : item.icon || index + 1}
              </div>

              <div className="mt-[var(--spacing-md)] flex flex-col items-center px-[var(--spacing-sm)] text-center">
                <span
                  className={cn(
                    'text-xs font-bold md:text-sm',
                    isActive
                      ? 'text-[var(--foreground)]'
                      : isPending
                        ? 'text-[var(--foreground-muted)]'
                        : 'text-[var(--foreground)]',
                  )}
                >
                  {item.label}
                </span>
                {item.description && (
                  <span className="mt-[var(--spacing-xs)] text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                    {item.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ),
);

Stepper.displayName = 'Stepper';
export default Stepper;
