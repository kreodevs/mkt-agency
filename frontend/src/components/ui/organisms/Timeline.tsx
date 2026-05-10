import { forwardRef, type ReactNode } from 'react'
import { Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TimelineItem {
    [key: string]: unknown
}

export interface TimelineProps {
    /** Array of data items to render as timeline events */
    value?: TimelineItem[]
    /** Alignment of the timeline: 'left' (default), 'right', or 'alternate' (zig-zag) */
    align?: 'left' | 'right' | 'alternate'
    /** Render function for the main content side of each item */
    content?: (item: TimelineItem) => ReactNode
    /** Render function for the opposite side (e.g. date, badges) */
    opposite?: (item: TimelineItem) => ReactNode
    /** Render function for the marker icon; defaults to <Circle /> */
    marker?: (item: TimelineItem) => ReactNode
    /** Additional class names for the root element */
    className?: string
}

const TimelineRoot = forwardRef<HTMLDivElement, TimelineProps>(
    ({ value = [], align = 'left', content, opposite, marker, className }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'timeline flex flex-col w-full',
                    align === 'alternate' && 'timeline--alternate',
                    align === 'right' && 'timeline--right',
                    className
                )}
                role="list"
                aria-label="Timeline"
            >
                {value.map((item, index) => {
                    const isLeft = align === 'left'
                    const isRight = align === 'right'
                    const isAlternate = align === 'alternate'
                    const itemOnLeft = isLeft || (isAlternate && index % 2 === 0)
                    const itemOnRight = isRight || (isAlternate && index % 2 !== 0)

                    return (
                        <div
                            key={index}
                            className={cn(
                                'timeline__item',
                                'flex relative min-h-[70px]',
                                isAlternate && index % 2 !== 0 && 'flex-row-reverse',
                                isRight && 'flex-row-reverse'
                            )}
                            role="listitem"
                        >
                            {/* Opposite side */}
                            <div
                                className={cn(
                                    'timeline__opposite',
                                    'flex-1 px-[var(--spacing-md)] py-[var(--spacing-xs)] text-sm text-[var(--foreground-muted)]',
                                    itemOnLeft && 'text-right',
                                    itemOnRight && 'text-left',
                                    isAlternate && index % 2 !== 0 && 'text-left',
                                    isAlternate && index % 2 === 0 && 'text-right'
                                )}
                            >
                                {opposite?.(item)}
                            </div>

                            {/* Separator (marker + connector) */}
                            <div className="timeline__separator flex-none flex flex-col items-center">
                                <div className="timeline__marker flex items-center justify-center w-4 h-4 rounded-full border-2 border-[var(--primary)] bg-[var(--card)] z-10 shadow-gold">
                                    {marker ? (
                                        marker(item)
                                    ) : (
                                        <Circle
                                            className="w-2.5 h-2.5 fill-[var(--primary)] text-[var(--primary)]"
                                            aria-hidden="true"
                                        />
                                    )}
                                </div>
                                <div className="timeline__connector flex-1 w-[2px] bg-[var(--border)]" />
                            </div>

                            {/* Content side */}
                            <div
                                className={cn(
                                    'timeline__content',
                                    'flex-1 px-[var(--spacing-md)] pb-[var(--spacing-lg)]',
                                    itemOnLeft && 'text-left',
                                    itemOnRight && 'text-right',
                                    isAlternate && index % 2 !== 0 && 'text-right',
                                    isAlternate && index % 2 === 0 && 'text-left'
                                )}
                            >
                                {content?.(item)}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }
)

TimelineRoot.displayName = 'Timeline'

export const Timeline = TimelineRoot
export default Timeline
