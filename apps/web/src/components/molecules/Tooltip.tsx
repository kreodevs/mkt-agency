import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TooltipInputProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delay?: number;
  className?: string;
  sideOffset?: number;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipInputProps>(
  (
    {
      content,
      children,
      side = 'top',
      align = 'center',
      delay = 200,
      className = '',
      sideOffset = 4,
    },
    ref,
  ) => (
    <TooltipPrimitive.Root delayDuration={delay}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          ref={ref}
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            'z-[var(--z-tooltip)] rounded-[var(--radius)] bg-[var(--foreground)] px-[var(--spacing-md)] py-1.5 text-xs font-medium text-[var(--background)] shadow-lg',
            className,
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  ),
);

Tooltip.displayName = 'Tooltip';
export const TooltipProvider = TooltipPrimitive.Provider;
export default Tooltip;
