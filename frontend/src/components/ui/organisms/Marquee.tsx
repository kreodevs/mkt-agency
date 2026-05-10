import React from "react";
import { cn } from "@/lib/utils";

export interface MarqueeProps {
    /** Contenido que se va a animar en bucle */
    children: React.ReactNode;
    /** Dirección del scroll (por defecto 'left') */
    direction?: "left" | "right";
    /** Si la animación debe pausarse al pasar el cursor (por defecto true) */
    pauseOnHover?: boolean;
    /** Clases adicionales para el contenedor principal */
    className?: string;
    /** Clases adicionales para el track que envuelve los elementos */
    innerClassName?: string;
    /** Duración de un ciclo completo (ej. '40s') */
    duration?: string;
    /** Espacio entre elementos repetidos (ej. '2rem') */
    gap?: string;
}

/**
 * Marquee - Un componente premium de scroll infinito (carrusel) ideal para logos, 
 * testimonios cortos o insignias, asegurando un movimiento continuo sin cortes.
 */
export function Marquee({
    children,
    direction = "left",
    pauseOnHover = true,
    className,
    innerClassName,
    duration = "40s",
    gap = "1rem",
}: MarqueeProps) {
    return (
        <div
            className={cn(
                "group flex overflow-hidden p-[var(--spacing-sm)] [--gap:1rem]",
                className
            )}
            style={
                {
                    "--duration": duration,
                    "--gap": gap,
                    gap: "var(--gap)",
                } as React.CSSProperties
            }
        >
            {/* Duplicamos el contenido para lograr el efecto infinito impecable */}
            {Array.from({ length: 2 }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "flex shrink-0 justify-around animate-kreo-marquee gap-[var(--gap)]",
                        direction === "right" && "reverse-animation",
                        // "reverse-animation" es un ajuste que podemos hacer en css pero,
                        // en Tailwind, si queremos reversa en run-time sin plugin adicional:
                        direction === "right" ? "[animation-direction:reverse]" : "",
                        pauseOnHover && "group-hover:[animation-play-state:paused]",
                        innerClassName
                    )}
                >
                    {children}
                </div>
            ))}
        </div>
    );
}
