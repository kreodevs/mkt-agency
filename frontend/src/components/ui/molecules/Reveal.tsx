import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type AnimationVariant =
    | 'fade-in'
    | 'fade-up'
    | 'fade-down'
    | 'fade-left'
    | 'fade-right'
    | 'zoom-in'
    | 'blur-in';

export interface RevealProps {
    /** Contenido a animar */
    children: ReactNode;
    /** Tipo de animación */
    variant?: AnimationVariant;
    /** Retraso en segundos */
    delay?: number;
    /** Duración de la animación en segundos (sobreescribe la duración por defecto de la clase Tailwind) */
    duration?: number;
    /** Margen para el trigger (0 a 1) */
    threshold?: number;
    /** Clases adicionales */
    className?: string;
    /** Si debe animarse solo una vez */
    once?: boolean;
}

/**
 * Reveal - Componente utilitario para animar la entrada de elementos al hacer scroll.
 * Proporciona el "factor Wow" con animaciones suaves y premium.
 */
export function Reveal({
    children,
    variant = 'fade-up',
    delay = 0,
    duration,
    threshold = 0.1,
    className,
    once = true
}: RevealProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (once) observer.disconnect();
                } else if (!once) {
                    setIsVisible(false);
                }
            },
            { threshold }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [once, threshold]);

    const animationClasses = {
        'fade-in': 'animate-kreo-fade-in',
        'fade-up': 'animate-kreo-fade-up',
        'fade-down': 'animate-kreo-fade-down',
        'fade-left': 'animate-kreo-fade-left',
        'fade-right': 'animate-kreo-fade-right',
        'zoom-in': 'animate-kreo-zoom-in',
        'blur-in': 'animate-kreo-blur-in'
    };

    return (
        <div
            ref={ref}
            className={cn(
                // Ocultar preventivamente si aún no es visible para evitar "flashes" antes del delay
                !isVisible && 'opacity-0',
                isVisible && animationClasses[variant],
                className
            )}
            style={{
                animationDelay: `${delay}s`,
                animationDuration: duration ? `${duration}s` : undefined,
                // 'both' obliga a CSS a aplicar el 0% opacity del keyframes
                // INCLUSO durante el tiempo de "delay", previniendo que se vea antes de tiempo.
                animationFillMode: 'both'
            }}
        >
            {children}
        </div>
    );
}
