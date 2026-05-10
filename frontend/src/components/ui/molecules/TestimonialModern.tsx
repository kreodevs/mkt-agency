import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Quote, Star } from "lucide-react";

export interface TestimonialModernProps {
    /** El texto del testimonio */
    quote: string;
    /** Nombre del autor */
    author: string;
    /** Cargo o rol del autor */
    role?: string;
    /** URL de la imagen del autor */
    image?: string;
    /** Logo de la empresa (JSX) */
    logo?: ReactNode;
    /** Calificación opcional (1-5) */
    rating?: number;
    /** Clases adicionales */
    className?: string;
    /** Variante visual: 'featured' es un banner grande, 'card' es una tarjeta compacta */
    variant?: 'featured' | 'card';
}

/**
 * TestimonialModern - Testimonios con estética refinada y gran tipografía.
 * Ideal para resaltar la confianza de clientes clave en sitios corporativos.
 */
export const TestimonialModern = ({
    quote,
    author,
    role,
    image,
    logo,
    rating,
    className,
    variant = 'featured'
}: TestimonialModernProps) => {
    const renderStars = (count: number) => (
        <div className="flex gap-[var(--spacing-xs)] mb-[var(--spacing-md)]">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        "w-3 h-3",
                        i < count ? "text-[var(--primary)] fill-[var(--primary)]" : "text-[var(--border)]"
                    )}
                />
            ))}
        </div>
    );

    if (variant === 'card') {
        return (
            <div className={cn(
                "relative group p-[var(--spacing-xl)] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition-all duration-300",
                className
            )}>
                {/* Adorno de fondo en hover */}
                <div className="absolute top-0 right-0 p-[var(--spacing-md)] opacity-[0.05] group-hover:opacity-10 transition-opacity">
                    <Quote className="w-12 h-12 rotate-180" />
                </div>

                {rating && renderStars(rating)}

                <p className="text-[var(--foreground)] text-lg leading-relaxed mb-[var(--spacing-xl)] italic">
                    "{quote}"
                </p>

                <div className="flex items-center gap-[var(--spacing-md)]">
                    {image ? (
                        <img
                            src={image}
                            className="w-12 h-12 rounded-full object-cover border-2 border-[var(--border)] group-hover:border-[var(--primary)]/50 transition-colors"
                            alt={author}
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-[var(--secondary)] flex items-center justify-center font-bold text-[var(--foreground-muted)]">
                            {author.charAt(0)}
                        </div>
                    )}
                    <div>
                        <div className="font-bold text-[var(--foreground)]">{author}</div>
                        <div className="text-sm text-[var(--foreground-muted)] font-medium">{role}</div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <section className={cn("relative py-24 bg-[var(--background)] overflow-hidden", className)}>
            {/* Elementos ambientales */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[var(--primary)]/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="container relative z-10 mx-auto px-[var(--spacing-md)] max-w-5xl text-center">
                <Quote className="mx-auto w-16 h-16 text-[var(--primary)]/20 mb-[var(--spacing-2xl)] animate-fade-in" />

                {rating && (
                    <div className="flex justify-center mb-[var(--spacing-lg)]">
                        {renderStars(rating)}
                    </div>
                )}

                <blockquote className="text-2xl md:text-4xl lg:text-5xl font-medium text-[var(--foreground)] leading-[1.2] mb-14 italic tracking-tight">
                    "{quote}"
                </blockquote>

                <div className="flex flex-col items-center">
                    {image && (
                        <div className="mb-[var(--spacing-lg)] relative">
                            <div className="absolute -inset-2 bg-gradient-to-r from-[var(--primary)] to-transparent rounded-full blur-md opacity-20" />
                            <img
                                src={image}
                                className="relative w-24 h-24 rounded-full object-cover border-4 border-[var(--background-secondary)] shadow-2xl"
                                alt={author}
                            />
                        </div>
                    )}

                    <div className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{author}</div>
                    <div className="text-[var(--primary)] font-bold text-xs tracking-[0.2em] uppercase mt-[var(--spacing-sm)]">{role}</div>

                    {logo && (
                        <div className="mt-[var(--spacing-2xl)] opacity-30 grayscale hover:opacity-60 transition-all duration-500 transform scale-110">
                            {logo}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};
