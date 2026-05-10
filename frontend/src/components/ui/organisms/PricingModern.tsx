import { useState, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Button, Reveal, AnimationVariant } from "@/components";

export interface PricingPlanModern {
    /** Nombre del plan */
    name: string;
    /** Objeto con precios para mensual y anual */
    price: {
        monthly: string | number;
        yearly: string | number;
    } | string | number;
    /** Breve descripción del plan */
    description: string;
    /** Lista de beneficios o características */
    features: string[];
    /** Si el plan está resaltado (recomendado) */
    isFeatured?: boolean;
    /** Texto del botón principal */
    ctaText?: string;
}

export interface PricingModernProps {
    /** Título de la sección */
    title?: string;
    /** Subtítulo descriptivo */
    subtitle?: string;
    /** Lista de planes */
    plans: PricingPlanModern[];
    /** Tipo de animación de entrada */
    animate?: AnimationVariant;
    /** Clases de Tailwind adicionales */
    className?: string;
}

/**
 * PricingModern - Una tabla de precios sofisticada y limpia.
 * Enfocada en la claridad y la conversión, con un toque Luxury.
 */
export const PricingModern = forwardRef<HTMLElement, PricingModernProps>(({
    title = "Planes de Inversión",
    subtitle = "Selecciona el nivel de servicio que mejor se adapte a tus objetivos estratégicos.",
    plans,
    animate = 'fade-up',
    className
}, ref) => {
    const [isYearly, setIsYearly] = useState(false);

    // Formateador de moneda interno
    const formatPrice = (p: string | number) => {
        if (typeof p === 'string') return p;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(p);
    };

    return (
        <section ref={ref} className={cn("py-24 bg-[var(--background)]", className)}>
            <div className="container mx-auto px-[var(--spacing-md)] max-w-7xl">
                <Reveal variant="fade-down" delay={0.2} threshold={0.1}>
                    <div className="text-center mb-20 text-balance">
                        <h2 className="text-4xl md:text-5xl font-black text-[var(--foreground)] mb-[var(--spacing-lg)] tracking-tight leading-tight">
                            {title}
                        </h2>
                        <p className="text-[var(--foreground-muted)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                            {subtitle}
                        </p>

                        {/* Toggle de facturación refinado */}
                        <div className="flex items-center justify-center mt-[var(--spacing-2xl)] gap-[var(--spacing-lg)] group">
                            <span className={cn(
                                "text-sm font-bold transition-colors uppercase tracking-widest",
                                !isYearly ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"
                            )}>
                                Mes
                            </span>
                            <button
                                onClick={() => setIsYearly(!isYearly)}
                                className="relative w-16 h-8 rounded-full bg-[var(--secondary)] border border-[var(--border)] transition-all hover:border-[var(--primary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 shadow-inner"
                            >
                                <div className={cn(
                                    "absolute top-1 left-1 w-6 h-6 rounded-full bg-[var(--primary)] transition-all duration-300 shadow-md",
                                    isYearly && "translate-x-8"
                                )} />
                            </button>
                            <span className={cn(
                                "text-sm font-bold transition-colors uppercase tracking-widest flex items-center gap-[var(--spacing-sm)]",
                                isYearly ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"
                            )}>
                                Año <span className="bg-[var(--success)]/10 text-[var(--success)] px-[var(--spacing-sm)] py-[var(--spacing-xxs)] rounded text-[10px] font-black italic">-20%</span>
                            </span>
                        </div>
                    </div>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-xl)] items-stretch perspective-lg">
                    {plans.map((plan, i) => (
                        <Reveal key={i} variant={animate} delay={0.4 + (i * 0.2)} threshold={0.1}>
                            <div className={cn(
                                "relative flex flex-col h-full p-[var(--spacing-2xl)] rounded-[var(--radius-2xl)] border transition-all duration-500 hover:translate-y-[-8px]",
                                plan.isFeatured
                                    ? "bg-[var(--card)] border-[var(--primary)]/50 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] scale-105 z-10"
                                    : "bg-[var(--background-secondary)]/50 border-[var(--border)] hover:border-[var(--primary)]/20"
                            )}>
                                {plan.isFeatured && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--primary)] text-[var(--primary-foreground)] px-[var(--spacing-lg)] py-1.5 text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(var(--primary-rgb),0.3)] flex items-center gap-[var(--spacing-sm)]">
                                        <Sparkles className="w-3 h-3" />
                                        Recomendado
                                    </div>
                                )}

                                <div className="mb-[var(--spacing-2xl)]">
                                    <h3 className="text-2xl font-black text-[var(--foreground)] mb-[var(--spacing-md)] tracking-tight">{plan.name}</h3>
                                    <p className="text-sm text-[var(--foreground-muted)] leading-relaxed min-h-[40px]">{plan.description}</p>
                                </div>

                                <div className="mb-[var(--spacing-2xl)]">
                                    <div className="flex items-baseline gap-[var(--spacing-sm)]">
                                        <span className="text-5xl font-black text-[var(--foreground)] tracking-tighter">
                                            {typeof plan.price === 'object'
                                                ? formatPrice(isYearly ? plan.price.yearly : plan.price.monthly)
                                                : plan.price
                                            }
                                        </span>
                                        {typeof plan.price === 'object' && (
                                            <span className="text-[var(--foreground-muted)] text-sm font-bold uppercase tracking-widest">
                                                / {isYearly ? 'año' : 'mes'}
                                            </span>
                                        )}
                                    </div>
                                    {isYearly && typeof plan.price === 'object' && (
                                        <div className="mt-[var(--spacing-sm)] text-[var(--success)] text-xs font-bold animate-fade-in">
                                            Ahorras {(Number(plan.price.monthly) * 12 - Number(plan.price.yearly)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} anuales
                                        </div>
                                    )}
                                </div>

                                <ul className="space-y-[var(--spacing-lg)] mb-[var(--spacing-2xl)] flex-1">
                                    {plan.features.map((feature, j) => (
                                        <li key={j} className="flex items-start gap-[var(--spacing-md)] text-sm text-[var(--foreground)] leading-tight">
                                            <div className="mt-[var(--spacing-xs)] flex-shrink-0 w-4 h-4 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                                                <Check className="w-2.5 h-2.5 text-[var(--primary)]" />
                                            </div>
                                            <span className="font-medium">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    variant={plan.isFeatured ? "default" : "outline"}
                                    className={cn(
                                        "w-full h-14 text-sm font-black uppercase tracking-widest transition-all",
                                        plan.isFeatured ? "shadow-gold hover:scale-[1.02]" : "hover:bg-[var(--secondary)]"
                                    )}
                                >
                                    {plan.ctaText || "Solicitar Acceso"}
                                    <ArrowRight className="ml-[var(--spacing-sm)] w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
});

PricingModern.displayName = 'PricingModern';
