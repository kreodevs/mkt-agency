import { ReactNode, forwardRef, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button, Reveal, AnimationVariant } from "@/components";
import { ArrowRight, ChevronRight, Play } from "lucide-react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface HeroModernProps {
    // ── Contenido ──────────────────────────────
    /** Titular principal con soporte para JSX */
    title: ReactNode;
    /** Subtítulo descriptivo */
    subtitle?: string;
    /** Etiqueta pequeña sobre el título */
    badge?: string;
    /** Contenido adicional libre debajo de los botones (stats, formulario, etc.) */
    children?: ReactNode;

    // ── Acciones ───────────────────────────────
    /** Acción principal (botón relleno) */
    primaryAction?: {
        label: string;
        onClick?: () => void;
        /** Link de navegación. Si se proporciona, se renderiza como <a> */
        href?: string;
    };
    /** Acción secundaria (botón outline / ghost) */
    secondaryAction?: {
        label: string;
        onClick?: () => void;
        href?: string;
        /** Muestra icono Play antes del label (útil para "Ver video") */
        withPlayIcon?: boolean;
    };

    // ── Elemento visual (mockup / producto) ────
    /** Elemento visual: imagen, video embed, mockup — se muestra debajo del CTA */
    visual?: ReactNode;

    // ── Background media ───────────────────────
    /** URL de imagen de fondo */
    backgroundImage?: string;
    /** URL de video de fondo (autoplay, muted, loop) */
    backgroundVideo?: string;
    /** Opacidad del overlay oscuro sobre el background (0–100). @default 60 */
    overlayOpacity?: number;

    // ── Parallax ───────────────────────────────
    /**
     * Activa el efecto parallax en el background media.
     * Solo tiene efecto cuando se usa `backgroundImage` o `backgroundVideo`.
     * @default false
     */
    parallax?: boolean;
    /**
     * Intensidad del efecto parallax (0.1 = sutil, 0.5 = intenso).
     * @default 0.4
     */
    parallaxIntensity?: number;

    // ── Layout ─────────────────────────────────
    /** Alineación horizontal del contenido. @default 'center' */
    align?: 'left' | 'center' | 'right';
    /**
     * Altura mínima de la sección.
     * - `full`   → 100vh
     * - `large`  → 85vh  (default)
     * - `medium` → 60vh
     * - `auto`   → altura natural del contenido (py-20 lg:py-32)
     * @default 'auto'
     */
    height?: 'full' | 'large' | 'medium' | 'auto';

    // ── Animación ──────────────────────────────
    /** Tipo de animación de entrada para el contenido. @default 'fade-up' */
    animate?: AnimationVariant;

    /** Clases de Tailwind adicionales */
    className?: string;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const heightMap = {
    full:   'min-h-screen',
    large:  'min-h-[85vh]',
    medium: 'min-h-[60vh]',
    auto:   'py-20 lg:py-32',
};

const alignTextMap = {
    left:   'text-left',
    center: 'text-center',
    right:  'text-right',
};

const alignItemsMap = {
    left:   'items-start',
    center: 'items-center',
    right:  'items-end',
};

const alignFlexMap = {
    left:   'justify-start',
    center: 'justify-center',
    right:  'justify-end',
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

/**
 * HeroModern — Sección Hero unificada, premium y de alto impacto.
 *
 * Absorbe todas las capacidades del legacy `HeroSection`:
 * background media, parallax, animaciones Reveal, alineación,
 * control de altura, slot visual y slot children libre.
 */
export const HeroModern = forwardRef<HTMLDivElement, HeroModernProps>((
    {
        title,
        subtitle,
        badge,
        children,
        primaryAction,
        secondaryAction,
        visual,
        backgroundImage,
        backgroundVideo,
        overlayOpacity = 60,
        parallax = false,
        parallaxIntensity = 0.4,
        align = 'center',
        height = 'auto',
        animate = 'fade-up',
        className,
    },
    ref
) => {
    const sectionRef  = useRef<HTMLDivElement>(null);
    const mediaRef    = useRef<HTMLDivElement>(null);
    const rafRef      = useRef<number | null>(null);

    const hasBackgroundMedia = !!(backgroundImage || backgroundVideo);
    const parallaxEnabled   = parallax && hasBackgroundMedia;

    // Merge de ref externo + interno
    const setRefs = useCallback(
        (node: HTMLDivElement | null) => {
            (sectionRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        },
        [ref]
    );

    // ── Parallax scroll handler ────────────────
    useEffect(() => {
        if (!parallaxEnabled) return;

        const handleScroll = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                const section = sectionRef.current;
                const media   = mediaRef.current;
                if (!section || !media) return;

                const rect          = section.getBoundingClientRect();
                const viewportHeight = window.innerHeight;

                if (rect.bottom < 0 || rect.top > viewportHeight) return;

                // progress: 0 = sección abajo del viewport, 1 = arriba
                // Centramos en 0.5 → offset ≈ 0 en posición típica de visualización
                const progress = 1 - rect.bottom / (viewportHeight + rect.height);
                const offset   = (progress - 0.5) * rect.height * parallaxIntensity;

                media.style.transform = `translateY(${offset}px)`;
            });
        };

        handleScroll(); // posición inicial
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [parallaxEnabled, parallaxIntensity]);

    // ── Render ─────────────────────────────────
    return (
        <section
            ref={setRefs}
            data-testid="hero-modern"
            className={cn(
                "relative w-full overflow-hidden bg-[var(--background)]",
                "flex flex-col",
                alignItemsMap[align],
                "justify-center",
                heightMap[height],
                className
            )}
        >
            {/* ── Background Media ── */}
            <div
                ref={mediaRef}
                className={cn(
                    "absolute inset-0 z-0",
                    parallaxEnabled && "scale-[1.2] origin-center"
                )}
                style={parallaxEnabled ? { willChange: 'transform' } : undefined}
            >
                {backgroundVideo ? (
                    <video
                        src={backgroundVideo}
                        autoPlay muted loop playsInline
                        className="w-full h-full object-cover"
                        data-testid="hero-video"
                    />
                ) : backgroundImage ? (
                    <img
                        src={backgroundImage}
                        alt=""
                        className="w-full h-full object-cover"
                        data-testid="hero-image"
                    />
                ) : (
                    /* Gradiente atmosférico por defecto (sin media) */
                    <div
                        className="w-full h-full"
                        style={{
                            background: `
                                radial-gradient(ellipse at 20% 50%, var(--accent) 0%, transparent 50%),
                                radial-gradient(ellipse at 80% 80%, var(--secondary) 0%, transparent 40%),
                                var(--background)
                            `,
                            opacity: 0.25,
                        }}
                    />
                )}
            </div>

            {/* ── Overlay ── */}
            <div
                className="absolute inset-0 bg-[var(--background)] z-[1]"
                style={{ opacity: hasBackgroundMedia ? overlayOpacity / 100 : 0 }}
                data-testid="hero-overlay"
            />

            {/* ── Decorativos ── */}
            <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
                {/* Línea superior dorada */}
                <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}
                />

                {/* Resplandor radial (solo sin media) */}
                {!hasBackgroundMedia && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[var(--primary)]/10 blur-[120px] rounded-full opacity-30" />
                )}

                {/* Patrón de puntos */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `radial-gradient(var(--foreground) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Gradiente de fade inferior */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, var(--background), transparent)' }}
                />
            </div>

            {/* ── Contenido ── */}
            <div
                className={cn(
                    "relative z-10 w-full max-w-6xl mx-auto",
                    "px-[var(--spacing-md)] sm:px-6 lg:px-8",
                    height === 'auto' ? "py-0" : "py-[var(--spacing-3xl)] sm:py-20 lg:py-24",
                    "flex flex-col",
                    alignTextMap[align],
                    alignItemsMap[align],
                )}
            >
                {/* Badge animado */}
                {badge && (
                    <Reveal variant="fade-down" delay={0.2}>
                        <div
                            className="inline-flex items-center rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-[var(--spacing-md)] py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--primary)] mb-[var(--spacing-xl)] shadow-sm backdrop-blur-sm"
                            data-testid="hero-badge"
                        >
                            <span className="mr-[var(--spacing-sm)] flex h-2 w-2">
                                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-[var(--primary)] opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--primary)]" />
                            </span>
                            {badge}
                        </div>
                    </Reveal>
                )}

                {/* Título */}
                <Reveal variant={animate} delay={0.4}>
                    <h1
                        className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-[var(--foreground)] mb-[var(--spacing-xl)] leading-[1.05] max-w-4xl"
                        data-testid="hero-title"
                    >
                        {title}
                    </h1>
                </Reveal>

                {/* Subtítulo */}
                {subtitle && (
                    <Reveal variant={animate} delay={0.6}>
                        <p
                            className="max-w-2xl text-lg md:text-xl text-[var(--foreground-muted)] mb-[var(--spacing-2xl)] leading-relaxed"
                            data-testid="hero-subtitle"
                        >
                            {subtitle}
                        </p>
                    </Reveal>
                )}

                {/* Botones */}
                {(primaryAction || secondaryAction) && (
                    <Reveal variant={animate} delay={0.8}>
                        <div
                            className={cn(
                                "flex flex-col sm:flex-row gap-[var(--spacing-md)] mb-[var(--spacing-3xl)]",
                                alignFlexMap[align]
                            )}
                        >
                            {primaryAction && (
                                primaryAction.href ? (
                                    <a
                                        href={primaryAction.href}
                                        className="inline-flex items-center justify-center gap-[var(--spacing-sm)] h-14 px-[var(--spacing-2xl)] text-lg font-semibold rounded-[var(--radius)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-gold transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                                    >
                                        {primaryAction.label}
                                        <ArrowRight className="w-5 h-5" />
                                    </a>
                                ) : (
                                    <Button
                                        size="lg"
                                        className="h-14 px-[var(--spacing-2xl)] text-lg shadow-gold transition-all hover:scale-105 active:scale-95"
                                        onClick={primaryAction.onClick}
                                    >
                                        {primaryAction.label}
                                        <ChevronRight className="ml-[var(--spacing-sm)] w-5 h-5" />
                                    </Button>
                                )
                            )}
                            {secondaryAction && (
                                secondaryAction.href ? (
                                    <a
                                        href={secondaryAction.href}
                                        className="inline-flex items-center justify-center gap-[var(--spacing-sm)] h-14 px-[var(--spacing-2xl)] text-lg font-semibold rounded-[var(--radius)] border border-[var(--foreground)]/30 bg-transparent text-[var(--foreground)] backdrop-blur-sm transition-all hover:bg-[var(--foreground)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                                    >
                                        {secondaryAction.withPlayIcon && <Play className="w-5 h-5" />}
                                        {secondaryAction.label}
                                    </a>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="h-14 px-[var(--spacing-2xl)] text-lg bg-[var(--card)]/50 backdrop-blur-sm transition-all hover:bg-[var(--secondary)]"
                                        onClick={secondaryAction.onClick}
                                    >
                                        {secondaryAction.withPlayIcon && <Play className="mr-[var(--spacing-sm)] w-5 h-5" />}
                                        {secondaryAction.label}
                                    </Button>
                                )
                            )}
                        </div>
                    </Reveal>
                )}

                {/* Children (slot libre) */}
                {children && (
                    <div className="w-full" data-testid="hero-children">
                        {children}
                    </div>
                )}

                {/* Visual / Mockup */}
                {visual && (
                    <Reveal variant="zoom-in" delay={1}>
                        <div className="relative mt-[var(--spacing-2xl)] max-w-5xl mx-auto w-full">
                            <div className="absolute -inset-4 bg-gradient-to-r from-[var(--primary)]/20 to-transparent blur-3xl opacity-30" />
                            <div className="relative rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                                {visual}
                            </div>
                        </div>
                    </Reveal>
                )}
            </div>

            {/* Línea de gradiente inferior sutil */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent z-[3]" />
        </section>
    );
});

HeroModern.displayName = 'HeroModern';

export default HeroModern;
