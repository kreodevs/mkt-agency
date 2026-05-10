import React from 'react'
import { cn } from '@/lib/utils'

export const DescriptionList = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    return (
        <dl className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[var(--spacing-md)] gap-y-[var(--spacing-lg)] md:gap-y-8 p-[var(--spacing-lg)] bg-[var(--background)] rounded-[var(--radius)] border border-[var(--border)]", className)}>
            {children}
        </dl>
    )
}

export const DescriptionListItem = ({
    label,
    value,
    colSpan = 1
}: {
    label: React.ReactNode,
    value: React.ReactNode,
    colSpan?: 1 | 2 | 3
}) => {
    return (
        <div className={cn(
            "flex flex-col space-y-1.5",
            colSpan === 2 && "sm:col-span-2",
            colSpan === 3 && "sm:col-span-2 lg:col-span-3"
        )}>
            <dt className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                {label}
            </dt>
            <dd className="text-sm text-[var(--foreground)] font-medium leading-relaxed">
                {value}
            </dd>
        </div>
    )
}
