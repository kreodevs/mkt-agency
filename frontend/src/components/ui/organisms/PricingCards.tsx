import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../atoms/Button';
import { Check } from 'lucide-react';

export interface PricingTier {
    name: string;
    description: string;
    price: string;
    priceCycle?: string;
    yearlyPrice?: string;
    yearlyPriceCycle?: string;
    features: string[];
    highlighted?: boolean;
    ctaText?: string;
    ctaVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
    badge?: string;
    onClickCta?: () => void;
}

export interface PricingCardsProps {
    tiers: PricingTier[];
    billingCycleOptions?: string[]; // e.g. ['Mensual', 'Anual']
    defaultCycle?: string;
    onCycleChange?: (cycle: string) => void;
    className?: string;
}

export const PricingCards = ({ tiers, billingCycleOptions, defaultCycle, onCycleChange, className }: PricingCardsProps) => {
    const [activeCycle, setActiveCycle] = useState(defaultCycle || (billingCycleOptions?.[0] || 'Mensual'));

    const handleCycleChange = (cycle: string) => {
        setActiveCycle(cycle);
        onCycleChange?.(cycle);
    };

    const isYearly = billingCycleOptions && activeCycle === billingCycleOptions[1];

    return (
        <div className={cn("w-full max-w-7xl mx-auto flex flex-col items-center py-[var(--spacing-2xl)]", className)}>
            {/* Billing Toggle (Monthly / Yearly) */}
            {billingCycleOptions && billingCycleOptions.length > 0 && (
                <div className="inline-flex items-center p-[var(--spacing-xs)] bg-[var(--secondary)] rounded-full mb-[var(--spacing-2xl)] border border-[var(--border)] shadow-sm">
                    {billingCycleOptions.map((cycle) => (
                        <button
                            key={cycle}
                            onClick={() => handleCycleChange(cycle)}
                            className={cn(
                                "px-[var(--spacing-lg)] py-2.5 text-sm font-semibold rounded-full transition-all duration-300",
                                activeCycle === cycle
                                    ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm border border-[var(--border)]"
                                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-transparent"
                            )}
                        >
                            {cycle}
                        </button>
                    ))}
                </div>
            )}

            {/* Pricing Cards Grid */}
            <div className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-xl)] w-full max-w-5xl items-center",
                tiers.length === 3 && "lg:grid-cols-3 max-w-7xl items-stretch"
            )}>
                {tiers.map((tier, idx) => {
                    const price = isYearly && tier.yearlyPrice ? tier.yearlyPrice : tier.price;
                    const cycle = isYearly && tier.yearlyPrice ? (tier.yearlyPriceCycle || 'año') : (tier.priceCycle || 'mes');

                    return (
                        <div
                            key={idx}
                            className={cn(
                                "relative flex flex-col p-[var(--spacing-xl)] rounded-[2rem] bg-[var(--background)] border transition-all duration-300 h-full",
                                tier.highlighted
                                    ? "border-[var(--primary)] ring-4 ring-[var(--primary)]/10 shadow-xl lg:scale-105 z-10"
                                    : "border-[var(--border)] shadow-sm hover:border-[var(--border-hover)]"
                            )}
                        >
                            {tier.badge && (
                                <div className="absolute top-0 right-8 -translate-y-1/2 px-[var(--spacing-md)] py-[var(--spacing-xs)] bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-black rounded-full shadow-sm uppercase tracking-widest">
                                    {tier.badge}
                                </div>
                            )}

                            <div className="mb-[var(--spacing-lg)]">
                                <h3 className="text-2xl font-bold text-[var(--foreground)]">{tier.name}</h3>
                                <p className="text-sm text-[var(--foreground-muted)] mt-[var(--spacing-sm)] font-medium">{tier.description}</p>
                            </div>

                            <div className="mb-[var(--spacing-xl)]">
                                <div className="flex items-baseline gap-[var(--spacing-xs)]">
                                    <span className="text-5xl font-extrabold text-[var(--foreground)] tracking-tight transition-all duration-300">{price}</span>
                                    {cycle && <span className="text-base font-semibold text-[var(--foreground-muted)]">/{cycle}</span>}
                                </div>
                            </div>

                            <ul className="flex flex-col gap-[var(--spacing-md)] mb-[var(--spacing-xl)] flex-1">
                                {tier.features.map((feature, fIdx) => (
                                    <li key={fIdx} className="flex items-start gap-[var(--spacing-md)]">
                                        <div className="bg-[var(--primary)]/10 p-[var(--spacing-xs)] rounded-full shrink-0">
                                            <Check className="w-4 h-4 text-[var(--primary)]" />
                                        </div>
                                        <span className="text-sm text-[var(--foreground)] leading-tight font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className="w-full mt-auto font-bold h-12 text-base rounded-2xl"
                                variant={tier.ctaVariant || (tier.highlighted ? 'default' : 'secondary')}
                                onClick={tier.onClickCta}
                            >
                                {tier.ctaText || 'Empezar ahora'}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
