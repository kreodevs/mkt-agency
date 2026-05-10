import { forwardRef, ReactNode } from 'react'
import { Card, Reveal, AnimationVariant } from '@/components'
import { cn } from '@/lib/utils'
import {
  Building2,
  Shield,
  Clock,
  Users,
  Award,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================
export interface Feature {
  /** Icono de Lucide React */
  icon: LucideIcon
  /** Título de la característica */
  title: string
  /** Descripción */
  description: string
  /** Enlace opcional */
  href?: string
  /** Color de acento personalizado (CSS variable o hex) */
  accentColor?: string
}

export interface FeatureGridProps {
  /** Título de la sección */
  title?: ReactNode
  /** Subtítulo */
  subtitle?: string
  /** Badge superior */
  badge?: string
  /** Lista de características */
  features: Feature[]
  /** Número de columnas en desktop */
  columns?: 2 | 3 | 4
  /** Variante visual de las cards */
  variant?: 'default' | 'bordered' | 'elevated' | 'minimal'
  /** Alineación del header */
  headerAlign?: 'left' | 'center'
  /** Animación de entrada general */
  animate?: AnimationVariant
  /** Clases adicionales */
  className?: string
}

// ============================================
// DEFAULT FEATURES (Construction Company Example)
// ============================================
export const defaultConstructionFeatures: Feature[] = [
  {
    icon: Building2,
    title: 'Proyectos Residenciales',
    description:
      'Diseño y construcción de viviendas de alta calidad con acabados premium y atención al detalle.',
  },
  {
    icon: Shield,
    title: 'Garantía de Calidad',
    description:
      'Todos nuestros proyectos cuentan con garantía extendida y materiales certificados.',
  },
  {
    icon: Clock,
    title: 'Entregas a Tiempo',
    description:
      'Cumplimos con los plazos establecidos gracias a nuestra metodología de gestión eficiente.',
  },
  {
    icon: Users,
    title: 'Equipo Experto',
    description:
      'Profesionales con más de 20 años de experiencia en el sector de la construcción.',
  },
  {
    icon: Award,
    title: 'Reconocimientos',
    description:
      'Múltiples premios de excelencia en diseño arquitectónico y sostenibilidad.',
  },
  {
    icon: Wrench,
    title: 'Mantenimiento',
    description:
      'Servicio post-venta y mantenimiento preventivo para proteger tu inversión.',
  },
]

// ============================================
// COMPONENT
// ============================================
export const FeatureGrid = forwardRef<HTMLElement, FeatureGridProps>(
  (
    {
      title = 'Nuestros Servicios',
      subtitle,
      badge,
      features = defaultConstructionFeatures,
      columns = 3,
      variant = 'default',
      headerAlign = 'center',
      animate = 'fade-up',
      className = '',
    },
    ref
  ) => {
    // Column grid classes
    const columnStyles = {
      2: 'sm:grid-cols-2',
      3: 'sm:grid-cols-2 lg:grid-cols-3',
      4: 'sm:grid-cols-2 lg:grid-cols-4',
    }



    // Header alignment
    const headerAlignStyles = {
      left: 'text-left items-start',
      center: 'text-center items-center',
    }

    return (
      <section
        ref={ref}
        className={`
          py-[var(--spacing-3xl)] sm:py-20 lg:py-24
          px-[var(--spacing-md)] sm:px-6 lg:px-8
          bg-[var(--background)]
          ${className}
        `}
        data-testid="feature-grid"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <Reveal variant="fade-down" delay={0.2} threshold={0.1}>
            <header
              className={`
                flex flex-col ${headerAlignStyles[headerAlign]}
                mb-[var(--spacing-2xl)] sm:mb-16
              `}
            >
              {badge && (
                <span
                  className="
                    inline-flex items-center
                    px-[var(--spacing-md)] py-[var(--spacing-xs)] mb-[var(--spacing-md)]
                    text-xs font-semibold tracking-wider uppercase
                    rounded-full
                    bg-[var(--accent)]/10 text-[var(--accent)]
                    border border-[var(--accent)]/20
                  "
                  data-testid="feature-badge"
                >
                  {badge}
                </span>
              )}

              {title && (
                <h2
                  className="
                    text-2xl sm:text-3xl lg:text-4xl
                    font-bold text-[var(--foreground)]
                    tracking-tight
                  "
                  style={{ fontFamily: 'var(--font-display), serif' }}
                  data-testid="feature-title"
                >
                  {title}
                </h2>
              )}

              {subtitle && (
                <p
                  className="
                    mt-[var(--spacing-md)] text-base sm:text-lg
                    text-[var(--foreground-muted)]
                    max-w-2xl
                  "
                  data-testid="feature-subtitle"
                >
                  {subtitle}
                </p>
              )}
            </header>
          </Reveal>

          {/* Grid */}
          <div
            className={`
                grid grid-cols-1 ${columnStyles[columns as keyof typeof columnStyles]}
                gap-[var(--spacing-lg)] sm:gap-8
              `}
            data-testid="feature-grid-container"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon
              const accentColor = feature.accentColor || 'var(--accent)'

              return (
                <Reveal key={index} variant={animate} delay={0.4 + (index * 0.15)} threshold={0.1}>
                  <Card
                    className={cn(
                      "group h-full border-[var(--border)] transition-all duration-500",
                      variant === 'bordered' && "bg-transparent border-2",
                      variant === 'elevated' && "shadow-xl hover:-translate-y-2",
                      variant === 'minimal' && "bg-transparent border-none shadow-none hover:bg-[var(--secondary)]",
                      feature.href && "cursor-pointer"
                    )}
                    onClick={() => feature.href && (window.location.href = feature.href)}
                  >
                    {/* Icon */}
                    <div
                      className="
                          w-12 h-12 sm:w-14 sm:h-14
                          flex items-center justify-center
                          rounded-2xl
                          transition-all duration-500
                          group-hover:scale-110 group-hover:rotate-3
                        "
                      style={{
                        backgroundColor: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${accentColor} 20%, transparent)`,
                      }}
                    >
                      <Icon
                        className="w-6 h-6 sm:w-7 sm:h-7 transition-colors"
                        style={{ color: accentColor }}
                      />
                    </div>

                    {/* Content */}
                    <h3
                      className="
                          mt-[var(--spacing-lg)] sm:mt-8
                          text-xl sm:text-2xl
                          font-black text-[var(--foreground)]
                          group-hover:text-[var(--primary)]
                          transition-colors duration-300
                          tracking-tight
                        "
                    >
                      {feature.title}
                    </h3>

                    <p
                      className="
                          mt-[var(--spacing-md)] sm:mt-4
                          text-sm sm:text-lg
                          text-[var(--foreground-muted)]
                          leading-relaxed
                        "
                    >
                      {feature.description}
                    </p>

                    {/* Link indicator */}
                    {feature.href && (
                      <div
                        className="
                            mt-[var(--spacing-lg)] pt-[var(--spacing-lg)]
                            border-t border-[var(--border)]
                            text-xs font-black uppercase tracking-[0.2em]
                            text-[var(--primary)]
                            flex items-center gap-[var(--spacing-sm)]
                            opacity-0 group-hover:opacity-100
                            transition-all duration-300 translate-y-2 group-hover:translate-y-0
                          "
                      >
                        Saber más <span className="text-lg">→</span>
                      </div>
                    )}
                  </Card>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>
    )
  }
)

FeatureGrid.displayName = 'FeatureGrid'

export default FeatureGrid
