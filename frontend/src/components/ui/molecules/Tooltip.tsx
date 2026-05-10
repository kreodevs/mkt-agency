import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface TooltipInputProps {
  /** Texto o contenido del tooltip */
  content: React.ReactNode
  /** Elemento trigger que activará el tooltip */
  children: React.ReactNode
  /** Posición del tooltip relativa al trigger */
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** Alineación del tooltip */
  align?: 'start' | 'center' | 'end'
  /** Delay en ms antes de mostrar el tooltip (por defecto 200) */
  delay?: number
  /** Clases adicionales para el contenido del tooltip */
  className?: string
  /** Desplazamiento desde el trigger (por defecto 4) */
  sideOffset?: number
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
  ) => {
    return (
      <TooltipPrimitive.Root delayDuration={delay}>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            ref={ref}
            side={side}
            align={align}
            sideOffset={sideOffset}
            className={cn(
              'z-[var(--z-tooltip)]',
              'px-[var(--spacing-md)] py-1.5',
              'text-xs font-medium',
              'rounded-[var(--radius)]',
              'bg-[var(--foreground)] text-[var(--background)]',
              'shadow-lg',
              className,
            )}
          >
            {content}
            <TooltipPrimitive.Arrow
              className="fill-[var(--foreground)]"
              width={8}
              height={8}
            />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    )
  },
)

Tooltip.displayName = 'Tooltip'

/** Provider necesario a nivel raíz de la aplicación para activar tooltips */
export const TooltipProvider = TooltipPrimitive.Provider
export const TooltipTrigger = TooltipPrimitive.Trigger
export const TooltipContent = TooltipPrimitive.Content

export default Tooltip
