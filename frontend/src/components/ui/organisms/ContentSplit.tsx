import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button, Reveal, AnimationVariant } from "@/components";

export interface ContentSplitProps {
    /** Título del bloque */
    title: string;
    /** Texto descriptivo */
    description: string;
    /** URL de la imagen */
    image: string;
    /** Lista de puntos clave (opcional) */
    features?: string[];
    /** Texto del botón de acción */
    ctaText?: string;
    /** Posición de la imagen: 'left' o 'right' */
    imagePosition?: 'left' | 'right';
    /** Clases adicionales */
    className?: string;
    /** Si debe tener fondo alternativo */
    alternate?: boolean;
    /** Si las animaciones Reveal están activadas */
    animate?: boolean;
}

/**
 * ContentSplit - Bloques de contenido mixto (imagen + texto) con alta legibilidad.
 * Diseñado para alternarse en cascada para guiar la lectura.
 */
export const ContentSplit = forwardRef<HTMLElement, ContentSplitProps>(({
    title,
    description,
    image,
    features,
    ctaText,
    imagePosition = 'right',
    className,
    alternate = false,
    animate = true
}, ref) => {

    // Wrapper helper para no ensuciar el código condicionalmente evaluando "animate"
    const AnimWrapper = ({ children, delay, variant = 'fade-up', className }: { children: React.ReactNode, delay: number, variant?: AnimationVariant, className?: string }) => {
        if (!animate) return <div className={className}>{children}</div>;
        return <Reveal delay={delay} variant={variant} duration={1} className={className}>{children}</Reveal>;
    };

    return (
        <section
            ref={ref}
            className={cn(
                "py-24 overflow-hidden",
                alternate ? "bg-[var(--secondary)]/30" : "bg-[var(--background)]",
                className
            )}
        >
            <div className="container mx-auto px-[var(--spacing-md)] max-w-7xl">
                <div className={cn(
                    "flex flex-col lg:items-start gap-[var(--spacing-3xl)] lg:gap-24",
                    imagePosition === 'left' ? "lg:flex-row-reverse" : "lg:flex-row"
                )}>
                    {/* Columna de Texto */}
                    <div className="flex-1 lg:py-12">
                        <AnimWrapper delay={0.1} variant={imagePosition === 'left' ? 'fade-right' : 'fade-left'}>
                            <h2 className="text-4xl md:text-5xl font-black text-[var(--foreground)] mb-[var(--spacing-xl)] tracking-tight leading-[1.1]">
                                {title}
                            </h2>
                        </AnimWrapper>

                        <AnimWrapper delay={0.2} variant="fade-up">
                            <p className="text-[var(--foreground-muted)] text-lg md:text-xl mb-[var(--spacing-2xl)] leading-relaxed">
                                {description}
                            </p>
                        </AnimWrapper>

                        {features && (
                            <ul className="space-y-[var(--spacing-lg)] mb-[var(--spacing-2xl)]">
                                {features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-[var(--spacing-md)] group">
                                        <AnimWrapper delay={0.3 + (i * 0.1)} variant="fade-up">
                                            <div className="flex items-start gap-[var(--spacing-md)]">
                                                <div className="mt-[var(--spacing-xs)] flex-shrink-0 w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors">
                                                    <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                                                </div>
                                                <span className="text-[var(--foreground)] font-medium leading-tight">{feature}</span>
                                            </div>
                                        </AnimWrapper>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {ctaText && (
                            <AnimWrapper delay={0.5} variant="fade-up">
                                <Button className="h-14 px-[var(--spacing-xl)] rounded-xl font-black uppercase tracking-widest group">
                                    {ctaText}
                                    <ArrowRight className="ml-[var(--spacing-sm)] w-5 h-5 transition-transform group-hover:translate-x-2" />
                                </Button>
                            </AnimWrapper>
                        )}
                    </div>

                    {/* Columna de Imagen con estilo Premium */}
                    <div className="flex-1 relative w-full">
                        <AnimWrapper delay={0.3} variant={imagePosition === 'left' ? 'fade-left' : 'fade-right'} className="w-full relative">
                            <div className="relative group overflow-hidden rounded-[var(--radius-2xl)] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] w-full">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 pointer-events-none" />
                                <img
                                    src={image}
                                    alt={title}
                                    className="w-full h-full object-cover aspect-[4/5] md:aspect-[3/4] scale-105 group-hover:scale-110 transition-transform duration-1000 ease-out"
                                />
                            </div>
                        </AnimWrapper>
                    </div>
                </div>
            </div>
        </section>
    );
});

ContentSplit.displayName = 'ContentSplit';
