import { forwardRef, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StepperItem {
    label: string
    description?: string
    icon?: ReactNode
}

export interface StepperProps {
    model: StepperItem[]
    activeIndex?: number
    readOnly?: boolean
    onSelect?: (e: { index: number; item: StepperItem }) => void
    className?: string
}

export const Stepper = forwardRef<HTMLDivElement, StepperProps>(
    ({ model, activeIndex = 0, readOnly = true, onSelect, className }, ref) => {
        return (
            <div ref={ref} className={cn("w-full py-[var(--spacing-lg)]", className)}>
                <div className="flex items-start justify-between relative w-full">
                    {model.map((item, index) => {
                        const isCompleted = index < activeIndex
                        const isActive = index === activeIndex
                        const isPending = index > activeIndex
                        const isLast = index === model.length - 1

                        return (
                            <div key={index} className={cn("flex flex-col items-center flex-1 relative group w-full", !readOnly && "cursor-pointer")}
                                onClick={() => {
                                    if (!readOnly && onSelect) {
                                        onSelect({ index, item })
                                    }
                                }}
                            >
                                {/* Line connecting the steps */}
                                {!isLast && (
                                    <div className="absolute top-5 left-[50%] w-full h-[2px] z-0">
                                        <div className={cn(
                                            "h-full transition-all duration-500 ease-in-out",
                                            isCompleted ? "bg-[var(--primary)] shadow-[0_0_8px_var(--primary)] opacity-70" : "bg-[var(--border)]"
                                        )}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                )}

                                {/* Step Container */}
                                <div className={cn(
                                    "relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 ease-in-out bg-[var(--background)]",
                                    isActive && "border-[var(--primary)] text-[var(--primary)] ring-4 ring-[var(--primary)]/10 scale-110 shadow-lg shadow-[var(--primary)]/20",
                                    isCompleted && "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]",
                                    isPending && "border-[var(--border)] text-[var(--foreground-muted)] group-hover:border-[var(--primary)]/50",
                                    !readOnly && !isActive && !isCompleted && "hover:bg-[var(--secondary)]"
                                )}>
                                    {isCompleted ? <Check className="w-5 h-5 animate-in zoom-in duration-300" /> : (item.icon || (index + 1))}
                                </div>

                                {/* Texts */}
                                <div className={cn("mt-[var(--spacing-md)] flex flex-col items-center text-center transition-all duration-300 px-[var(--spacing-sm)]", isActive && "-translate-y-1")}>
                                    <span className={cn(
                                        "text-sm font-bold transition-colors duration-300",
                                        isActive ? "text-[var(--foreground)]" : isPending ? "text-[var(--foreground-muted)]" : "text-[var(--foreground)]"
                                    )}>
                                        {item.label}
                                    </span>
                                    {item.description && (
                                        <span className={cn(
                                            "text-[10px] mt-[var(--spacing-xs)] uppercase tracking-wider font-semibold",
                                            isActive ? "text-[var(--primary)]" : "text-[var(--foreground-subtle)]"
                                        )}>
                                            {item.description}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
)
Stepper.displayName = 'Stepper'

