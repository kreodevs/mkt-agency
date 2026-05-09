// REGISTRY: TagInput

import { forwardRef } from 'react'
import { Chips, type ChipsProps } from 'primereact/chips'
import { cn } from '@/lib/utils'

export interface TagInputProps extends ChipsProps {
    error?: string;
    label?: string;
}

export const TagInput = forwardRef<Chips, TagInputProps>(
    ({ className, error, label, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && <label className="text-sm font-medium leading-none text-[var(--foreground)]">{label}</label>}
                <Chips
                    ref={ref}
                    className={cn("w-full", className)}
                    pt={{
                        root: { className: "w-full" },
                        inputToken: { className: "flex-1 w-full min-w-[100px] p-[var(--spacing-sm)] py-[var(--spacing-xs)] text-sm bg-transparent border-0 outline-none text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]" },
                        container: {
                            className: cn(
                                "flex flex-wrap gap-[var(--spacing-sm)] p-[var(--spacing-sm)] w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] ring-offset-[var(--background)] transition-colors focus-within:ring-2 focus-within:ring-[var(--ring)] focus-within:ring-offset-2 hover:border-[var(--border-hover)]",
                                error && "border-[var(--destructive)] focus-within:ring-[var(--destructive)]"
                            )
                        },
                        token: { className: "flex items-center gap-1.5 px-2.5 py-[var(--spacing-xs)] text-xs font-semibold rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm" },
                        removeTokenIcon: { className: "w-3.5 h-3.5 cursor-pointer hover:opacity-80 transition-opacity ml-[var(--spacing-xs)]" }
                    }}
                    {...props}
                />
                {error && <span className="text-[14px] text-[var(--destructive)]">{error}</span>}
            </div>
        )
    }
)
TagInput.displayName = 'TagInput'
