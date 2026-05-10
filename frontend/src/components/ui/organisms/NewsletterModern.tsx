import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { Button, InputText, Reveal, AnimationVariant } from "@/components";

export interface NewsletterModernProps {
    /** Título principal */
    title?: string;
    /** Texto descriptivo */
    description?: string;
    /** Texto del botón */
    buttonText?: string;
    /** Marcador de posición del input */
    placeholder?: string;
    /** Tipo de animación de entrada */
    animate?: AnimationVariant;
    /** Clases adicionales */
    className?: string;
}

/**
 * NewsletterModern - Sección de captura de emails con diseño premium y minimalista.
 * Enfoque en la privacidad y la simplicidad visual.
 */
export const NewsletterModern = forwardRef<HTMLElement, NewsletterModernProps>(({
    title = "Únete a la Vanguardia",
    description = "Recibe insights exclusivos sobre arquitectura, inversión y el mercado inmobiliario premium directamente en tu bandeja de entrada.",
    buttonText = "Suscribirse",
    placeholder = "Escribe tu email corporativo...",
    animate = 'fade-up',
    className
}, ref) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Lógica de suscripción
    };

    return (
        <section ref={ref} className={cn("py-24 bg-[var(--background)]", className)}>
            <div className="container mx-auto px-[var(--spacing-md)] max-w-7xl">
                <div className="relative overflow-hidden rounded-[var(--radius-3xl)] bg-[var(--card)] border border-[var(--border)] p-[var(--spacing-xl)] md:p-16 lg:p-24 shadow-2xl">
                    {/* Adorno ambiental */}
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--primary)]/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-[var(--spacing-3xl)] items-center">
                        <Reveal variant={animate} delay={0.2}>
                            <div>
                                <div className="inline-flex items-center gap-[var(--spacing-sm)] px-[var(--spacing-md)] py-[var(--spacing-xs)] rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 mb-[var(--spacing-xl)]">
                                    <Mail className="w-3 h-3 text-[var(--primary)]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">Newsletter Exclusiva</span>
                                </div>

                                <h2 className="text-4xl md:text-6xl font-black text-[var(--foreground)] mb-[var(--spacing-lg)] tracking-tight leading-[1.1]">
                                    {title}
                                </h2>
                                <p className="text-[var(--foreground-muted)] text-lg md:text-xl max-w-xl leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        </Reveal>

                        <Reveal variant={animate} delay={0.4}>
                            <div className="flex flex-col gap-[var(--spacing-lg)]">
                                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-[var(--spacing-md)]">
                                    <div className="relative flex-1 group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-subtle)] group-focus-within:text-[var(--primary)] transition-colors" />
                                        <InputText
                                            type="email"
                                            placeholder={placeholder}
                                            className="w-full h-16 pl-[var(--spacing-2xl)] bg-[var(--background)]/50 border-[var(--border)] focus:border-[var(--primary)] rounded-2xl text-base"
                                            required
                                        />
                                    </div>
                                    <Button className="h-16 px-[var(--spacing-2xl)] rounded-2xl font-black uppercase tracking-widest group shadow-gold shadow-lg">
                                        {buttonText}
                                        <ArrowRight className="ml-[var(--spacing-sm)] w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </form>

                                <div className="flex items-center gap-[var(--spacing-md)] text-[var(--foreground-subtle)]">
                                    <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
                                    <span className="text-xs font-medium italic">Respetamos tu privacidad. Sin spam, solo contenido de valor. Cancela cuando quieras.</span>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </div>
        </section>
    );
});

NewsletterModern.displayName = 'NewsletterModern';
