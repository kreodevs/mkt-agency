import { Tooltip as PrimeTooltip, type TooltipProps as PrimeTooltipProps } from 'primereact/tooltip'
import { forwardRef, type ReactNode, useId } from 'react'

export interface TooltipInputProps extends Omit<PrimeTooltipProps, 'pt' | 'target'> {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  delay?: number
  className?: string
}

const positionMap: Record<string, "top" | "bottom" | "left" | "right"> = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipInputProps>(
  ({
    content,
    children,
    side = 'top',
    delay = 200,
    className = '',
    ...props
  }, ref) => {
    const id = useId()
    const targetId = `tooltip-target-${id.replace(/:/g, '')}`

    const ptStyles = {
      root: {
        className: `
          z-[var(--z-tooltip)]
          px-3 py-1.5
          text-xs font-medium
          rounded-[var(--radius)]
          bg-[var(--foreground)] text-[var(--background)]
          shadow-lg
          animate-fade-in
          ${className}
        `.trim(),
      },
      arrow: {
        className: `
          absolute w-2 h-2
          bg-[var(--foreground)]
          rotate-45
        `,
      },
      text: {
        className: '',
      },
    }

    return (
      <>
        <span id={targetId} className="inline-flex" ref={ref}>
          {children}
        </span>
        <PrimeTooltip
          target={`#${targetId}`}
          position={positionMap[side]}
          showDelay={delay}
          hideDelay={0}
          {...props}
          pt={ptStyles}
        >
          {content}
        </PrimeTooltip>
      </>
    )
  }
)

Tooltip.displayName = 'Tooltip'

// Simple wrapper for common use cases
export const TooltipTrigger = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex">{children}</span>
)

export const TooltipContent = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`text-xs ${className}`}>{children}</div>
)

export default Tooltip
