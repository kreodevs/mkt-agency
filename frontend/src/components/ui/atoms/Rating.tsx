// REGISTRY: Rating

import { forwardRef } from 'react'
import { Rating as PrimeRating, type RatingProps as PrimeRatingProps } from 'primereact/rating'
import { cn } from '@/lib/utils'

export interface RatingProps extends PrimeRatingProps {
    label?: string;
}

export const Rating = forwardRef<PrimeRating, RatingProps>(
    ({ className, label, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5">
                {label && <label className="text-sm font-medium text-[var(--foreground)]">{label}</label>}
                <PrimeRating
                    ref={ref}
                    className={cn("flex items-center gap-1.5", className)}
                    pt={{
                        item: { className: "cursor-pointer transition-transform hover:scale-110 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full" },
                        onIcon: { className: "text-[#E6B15C] fill-[#E6B15C] w-6 h-6" }, /* Dorado accent */
                        offIcon: { className: "text-[var(--border)] w-6 h-6 hover:text-[#E6B15C]/50 transition-colors" },
                        cancelIcon: { className: "text-[var(--destructive)] w-5 h-5 ml-[var(--spacing-sm)] hover:opacity-80 transition-opacity" }
                    }}
                    {...props}
                />
            </div>
        )
    }
)
Rating.displayName = 'Rating'
