import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Marquee } from "./Marquee";

export interface LogoItem {
    /** Nombre de la marca o empresa */
    name: string;
    /** Elemento visual del logo (normalmente un <img /> o <svg />) */
    image: string;
    /** Enlace opcional al sitio del partner */
    href?: string;
}

export interface LogosSectionProps {
    /** Título de la sección (ej: "CONFIADO POR LÍDERES GLOBALES") */
    title?: string;
    /** Lista de logos */
    logos: LogoItem[];
    /** Clases adicionales */
    className?: string;
    /** Si se debe mostrar en escala de grises */
    grayscale?: boolean;
    /** Si los logos deben animarse con un scroll infinito tipo Marquee */
    animate?: boolean;
}

/**
 * LogosSection - Una sección institucional para mostrar partners, clientes o prensa.
 * Diseño minimalista con alto contraste y enfoque en la autoridad de marca.
 */
export const LogosSection = forwardRef<HTMLElement, LogosSectionProps>(({
    title = "Trusted by World-Class Organizations",
    logos,
    className,
    grayscale = true,
    animate = false
}, ref) => {

    // Función reutilizable para renderizar la lista visual de los Logos independientemente del contenedor
    const renderedLogos = logos.map((item, i) => {
        const BrandWrapper = item.href ? 'a' : 'div';
        const props = item.href ? { href: item.href, target: "_blank", rel: "noopener noreferrer" } : {};

        return (
            <BrandWrapper
                key={i}
                {...props}
                className={cn(
                    "relative group flex items-center justify-center p-[var(--spacing-md)] transition-all duration-500",
                    !animate && "animate-fade-in", // Solo fade-in si no es marquee
                    item.href ? "cursor-pointer" : "cursor-default",
                    animate && "mx-[var(--spacing-xl)]" // Margen extra si estamos en un Flex Marquee
                )}
                style={!animate ? { animationDelay: `${i * 100}ms` } : undefined}
            >
                {/* Fondo sutil en hover */}
                <div className="absolute inset-x-0 inset-y-0 bg-[var(--primary)]/5 opacity-0 group-hover:opacity-100 rounded-lg blur-xl transition-opacity" />

                <img
                    src={item.image}
                    alt={item.name}
                    className={cn(
                        "relative h-8 sm:h-10 lg:h-12 w-auto object-contain transition-all duration-500 opacity-30 group-hover:opacity-100",
                        grayscale && "grayscale group-hover:grayscale-0",
                        "group-hover:scale-110"
                    )}
                />

                {/* Tooltip con el nombre */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.name}
                </div>
            </BrandWrapper>
        );
    });

    return (
        <section ref={ref} className={cn("py-[var(--spacing-3xl)] bg-[var(--background)]", className)}>
            <div className="container mx-auto px-[var(--spacing-md)] max-w-7xl">
                {title && (
                    <h3 className="text-center text-[10px] sm:text-xs font-black text-[var(--foreground-muted)] uppercase tracking-[0.4em] mb-[var(--spacing-2xl)] opacity-80">
                        {title}
                    </h3>
                )}

                {animate ? (
                    <div className="relative -mx-4 overflow-hidden py-[var(--spacing-md)] fade-sides">
                        {/* 
                            fade-sides es una clase que podemos inyectar como capa para desvanecer los bordes,
                            o bien un degradado css puro 
                        */}
                        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--background)] to-transparent z-10 pointer-events-none" />
                        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--background)] to-transparent z-10 pointer-events-none" />

                        <Marquee duration="40s" gap="0rem" pauseOnHover={true}>
                            {renderedLogos}
                        </Marquee>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[var(--spacing-2xl)] lg:gap-20 items-center justify-items-center">
                        {renderedLogos}
                    </div>
                )}
            </div>
        </section>
    );
});

LogosSection.displayName = 'LogosSection';
