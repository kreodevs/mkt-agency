import { Button } from '@/components'
import { cn } from '@/lib/utils'

export interface CTASectionProps {
    title: string
    description?: string
    primaryAction?: {
        label: string
        onClick: () => void
    }
    secondaryAction?: {
        label: string
        onClick: () => void
    }
    className?: string
    variant?: 'gold' | 'dark' | 'simple'
}

export function CTASection({
    title,
    description,
    primaryAction,
    secondaryAction,
    className,
    variant = 'gold'
}: CTASectionProps) {

    const variants = {
        gold: "bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-[var(--primary-foreground)]",
        dark: "bg-[var(--background-tertiary)] text-[var(--foreground)] border border-[var(--border)]",
        simple: "bg-transparent text-[var(--foreground)]"
    }

    return (
        <section className={cn(
            "relative py-[var(--spacing-3xl)] px-[var(--spacing-lg)] overflow-hidden rounded-[var(--radius-xl)]",
            variants[variant],
            className
        )}>
            {variant === 'gold' && (
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-white rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-black rounded-full blur-3xl" />
                </div>
            )}

            <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center">
                <h2 className={cn(
                    "text-3xl md:text-4xl font-bold mb-[var(--spacing-lg)] tracking-tight leading-tight",
                    variant === 'gold' ? "text-[var(--primary-foreground)]" : "text-[var(--foreground)]"
                )}>
                    {title}
                </h2>

                {description && (
                    <p className={cn(
                        "text-lg mb-[var(--spacing-2xl)] max-w-2xl",
                        variant === 'gold' ? "text-[var(--primary-foreground)]/80" : "text-[var(--foreground-muted)]"
                    )}>
                        {description}
                    </p>
                )}

                <div className="flex flex-wrap items-center justify-center gap-[var(--spacing-md)]">
                    {primaryAction && (
                        <Button
                            onClick={primaryAction.onClick}
                            variant={variant === 'gold' ? 'secondary' : 'default'}
                            size="lg"
                            className="min-w-[160px] shadow-lg"
                        >
                            {primaryAction.label}
                        </Button>
                    )}

                    {secondaryAction && (
                        <Button
                            onClick={secondaryAction.onClick}
                            variant="outline"
                            size="lg"
                            className={cn(
                                "min-w-[160px]",
                                variant === 'gold' && "border-[var(--primary-foreground)]/30 text-[var(--primary-foreground)] hover:bg-[var(--primary-foreground)]/10"
                            )}
                        >
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            </div>
        </section>
    )
}

export default CTASection
