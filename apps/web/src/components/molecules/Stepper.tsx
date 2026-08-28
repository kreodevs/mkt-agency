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
  /** When set, each step's completed state is independent (non-linear pipelines). */
  completedSteps?: boolean[];
  readOnly?: boolean;
  onSelect?: (e: { index: number; item: StepperItem }) => void;
  className?: string;
}

export const Stepper = forwardRef<HTMLDivElement, StepperProps>(
  (
    { model, activeIndex = 0, completedSteps, readOnly = true, onSelect, className },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        'w-full overflow-visible px-[var(--spacing-xs)] pb-[var(--spacing-lg)] pt-[var(--spacing-md)]',
        className,
      )}
    >
      <div className="relative flex w-full items-start justify-between overflow-x-auto overflow-y-visible">
        {model.map((item, index) => {
          const isCompleted = completedSteps?.[index] ?? index < activeIndex;
          const isActive = completedSteps
            ? index === activeIndex && !completedSteps[index]
            : index === activeIndex;
          const isPending = !isCompleted && !isActive;
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
                      isCompleted &&
                        (completedSteps?.[index + 1] ?? true)
                        ? 'bg-[var(--brand)] opacity-90'
                        : 'bg-[var(--border)]',
                    )}
                  />
                </div>
              )}

                  <div
                    className={cn(
                      'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-[var(--background)] text-sm font-bold transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                      isActive &&
                        'scale-110 border-[var(--brand)] text-[var(--brand)] shadow-lg ring-4 ring-[var(--brand)]/15',
                      isCompleted &&
                        'border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]',
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
