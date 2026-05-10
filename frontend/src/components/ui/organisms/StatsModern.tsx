import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface StatItem {
    /** El número o métrica (ej: "99.9%", "500k+", "24/7") */
    value: string;
    /** Etiqueta descriptiva */
    label: string;
    /** Icono o elemento decorativo opcional */
    icon?: React.ReactNode;
}

export interface StatsModernProps {
    /** Título de la sección */
    title?: string;
    /** Subtítulo */
    subtitle?: string;
    /** Lista de estadísticas */
    stats: StatItem[];
    /** Clases adicionales */
    className?: string;
    /** Variante: 'grid' para tarjetas, 'line' para una fila minimalista */
    variant?: 'grid' | 'line';
}

/**
 * StatsModern - Visualización de hitos y métricas clave con estética premium.
 * Utiliza tipografías grandes y espaciado generoso para transmitir autoridad.
 */
export const StatsModern = forwardRef<HTMLElement, StatsModernProps>(({
    title,
    subtitle,
    stats,
    className,
    variant = 'grid'
}, ref) => {
    return (
        <section ref={ref} className={cn("py-24 bg-[var(--background)]", className)}>
            <div className="container mx-auto px-[var(--spacing-md)] max-w-7xl">
                {(title || subtitle) && (
                    <div className="text-center mb-20 animate-fade-in">
                        {title && (
                            <h2 className="text-3xl md:text-5xl font-black text-[var(--foreground)] mb-[var(--spacing-lg)] tracking-tight">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-[var(--foreground-muted)] text-lg max-w-2xl mx-auto leading-relaxed">
                                {subtitle}
                            </p>
                        )}
                    </div>
                )}

                <div className={cn(
                    "grid gap-[var(--spacing-2xl)] lg:gap-8",
                    variant === 'grid'
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                        : "grid-cols-2 lg:flex lg:justify-between lg:items-center"
                )}>
                    {stats.map((stat, i) => (
                        <div
                            key={i}
                            className={cn(
                                "relative group animate-slide-up",
                                variant === 'grid' && "p-[var(--spacing-xl)] rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition-all duration-500 hover:translate-y-[-4px]"
                            )}
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            {variant === 'grid' && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-0 group-hover:opacity-50 transition-opacity" />
                            )}

                            <div className={cn(
                                "flex flex-col",
                                variant === 'line' ? "items-center lg:items-start" : "items-center"
                            )}>
                                {stat.icon && (
                                    <div className="mb-[var(--spacing-md)] text-[var(--primary)] opacity-80 group-hover:scale-110 transition-transform">
                                        {stat.icon}
                                    </div>
                                )}

                                <span className={cn(
                                    "font-black text-[var(--foreground)] tracking-tighter mb-[var(--spacing-sm)]",
                                    variant === 'grid' ? "text-4xl md:text-5xl lg:text-6xl" : "text-3xl md:text-4xl lg:text-5xl"
                                )}>
                                    {stat.value}
                                </span>

                                <span className="text-[var(--primary)] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-center lg:text-left">
                                    {stat.label}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
});

StatsModern.displayName = 'StatsModern';
