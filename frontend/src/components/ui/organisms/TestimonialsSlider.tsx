import { forwardRef, ReactNode } from 'react'
import { Quote, Star } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from '../molecules/Carousel'
import { cn } from '../../lib/utils'

// ============================================
// TYPES
// ============================================
export interface Testimonial {
  /** Identificador único */
  id: string | number
  /** Nombre del cliente */
  name: string
  /** Cargo o título */
  title?: string
  /** Empresa o ubicación */
  company?: string
  /** URL del avatar */
  avatar?: string
  /** Texto del testimonio */
  content: string
  /** Calificación (1-5) */
  rating?: number
  /** Proyecto relacionado */
  project?: string
}

export interface TestimonialsSliderProps {
  /** Título de la sección */
  title?: ReactNode
  /** Subtítulo */
  subtitle?: string
  /** Badge superior */
  badge?: string
  /** Lista de testimonios */
  testimonials: Testimonial[]
  /** Auto-play del slider */
  autoPlay?: boolean
  /** Intervalo de auto-play (ms) */
  autoPlayInterval?: number
  /** Mostrar controles de navegación */
  showControls?: boolean
  /** Mostrar indicadores de página */
  showDots?: boolean
  /** Variante visual */
  variant?: 'cards' | 'minimal' | 'featured'
  /** Posición de los controles */
  controlsPosition?: "sides" | "bottom" | "top"
  /** Desplazamiento de los controles (solo para 'sides') */
  controlsOffset?: "inner" | "outer"
  /** Forma de los controles */
  controlsShape?: "circle" | "rounded" | "square"
  /** Variante de estilo de los controles */
  controlsVariant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link"
  /** Clases adicionales */
  className?: string
}

// ============================================
// DEFAULT TESTIMONIALS (Construction Company)
// ============================================
export const defaultTestimonials: Testimonial[] = [
  {
    id: 1,
    name: 'María González',
    title: 'Propietaria',
    company: 'Casa Residencial, Polanco',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    content:
      'Construyeron nuestra casa de ensueño. El equipo fue profesional desde el primer día, cumpliendo cada detalle del diseño y entregando a tiempo. Superaron nuestras expectativas.',
    rating: 5,
    project: 'Residencia Polanco',
  },
  {
    id: 2,
    name: 'Carlos Mendoza',
    title: 'Director General',
    company: 'Grupo Inmobiliario Atlas',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    content:
      'Hemos trabajado juntos en más de 10 proyectos comerciales. Su capacidad de gestión y calidad de acabados los hace nuestro socio de confianza para desarrollos premium.',
    rating: 5,
    project: 'Torre Corporativa Reforma',
  },
  {
    id: 3,
    name: 'Ana Lucia Torres',
    title: 'Arquitecta',
    company: 'Studio Torres Diseño',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    content:
      'Como arquitecta, valoro trabajar con constructoras que entienden el diseño. Ellos traducen perfectamente los planos a realidad, respetando cada especificación técnica.',
    rating: 5,
    project: 'Loft Industrial Condesa',
  },
  {
    id: 4,
    name: 'Roberto Sánchez',
    title: 'Inversionista',
    company: 'RS Capital',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    content:
      'La transparencia en costos y la comunicación constante durante el proyecto generaron total confianza. Una inversión bien protegida con un equipo responsable.',
    rating: 5,
    project: 'Complejo Habitacional Sur',
  },
]

// ============================================
// COMPONENT
// ============================================
export const TestimonialsSlider = forwardRef<HTMLElement, TestimonialsSliderProps>(
  (
    {
      title = 'Lo que dicen nuestros clientes',
      subtitle,
      badge,
      testimonials = defaultTestimonials,
      autoPlay = true,
      autoPlayInterval = 5000,
      showControls = true,
      showDots = true,
      controlsPosition = "bottom",
      controlsOffset = "outer",
      controlsShape = "circle",
      controlsVariant = "outline",
      className = '',
    },
    ref
  ) => {
    // Render stars
    const renderStars = (rating: number = 5) => {
      return (
        <div className="flex gap-[var(--spacing-xs)]">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-4 h-4",
                i < rating
                  ? 'fill-[var(--accent)] text-[var(--accent)]'
                  : 'text-[var(--border)]'
              )}
            />
          ))}
        </div>
      )
    }

    // Avatar fallback
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    return (
      <section
        ref={ref}
        className={cn(
          "py-[var(--spacing-3xl)] sm:py-20 lg:py-24 px-[var(--spacing-md)] sm:px-6 lg:px-8 bg-[var(--secondary)] overflow-hidden",
          className
        )}
        data-testid="testimonials-slider"
      >
        <div className="max-w-6xl mx-auto px-[var(--spacing-md)] sm:px-12">
          {/* Header */}
          <header className="text-center mb-[var(--spacing-2xl)] sm:mb-16">
            {badge && (
              <span
                className="
                  inline-flex items-center gap-[var(--spacing-sm)]
                  px-[var(--spacing-md)] py-[var(--spacing-xs)] mb-[var(--spacing-md)]
                  text-xs font-semibold tracking-wider uppercase
                  rounded-full
                  bg-[var(--accent)]/10 text-[var(--accent)]
                  border border-[var(--accent)]/20
                "
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
              >
                {title}
              </h2>
            )}

            {subtitle && (
              <p className="mt-[var(--spacing-md)] text-base sm:text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </header>

          <Carousel
            opts={{
              loop: true,
            }}
            autoPlay={autoPlay}
            delay={autoPlayInterval}
            controlsPosition={controlsPosition}
            controlsOffset={controlsOffset}
            controlsShape={controlsShape}
            controlsVariant={controlsVariant}
            className="w-full relative"
          >
            {/* Top Navigation */}
            {showControls && controlsPosition === "top" && testimonials.length > 1 && (
              <div className="flex items-center justify-center gap-[var(--spacing-md)] mb-[var(--spacing-xl)]">
                <CarouselPrevious />
                <CarouselNext />
              </div>
            )}

            <CarouselContent>
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="md:basis-full lg:basis-full">
                  <div className="px-[var(--spacing-xs)]">
                    {/* Testimonial Card */}
                    <div className="relative">
                      {/* Quote Icon */}
                      <Quote
                        className="
                          absolute -top-4 left-1/2 -translate-x-1/2
                          w-8 h-8 sm:w-10 sm:h-10
                          text-[var(--accent)] opacity-30
                          z-10
                        "
                      />

                      {/* Main Card */}
                      <div
                        className="
                          relative
                          bg-[var(--card)]
                          border border-[var(--card-border)]
                          rounded-[var(--radius-lg)]
                          p-[var(--spacing-xl)] sm:p-10 lg:p-12
                          overflow-hidden
                        "
                      >
                        {/* Background decoration */}
                        <div
                          className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none"
                          style={{
                            background:
                              'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
                          }}
                        />

                        {/* Content */}
                        <div className="relative">
                          {/* Rating */}
                          {testimonial.rating && (
                            <div className="flex justify-center mb-[var(--spacing-lg)]">
                              {renderStars(testimonial.rating)}
                            </div>
                          )}

                          {/* Quote */}
                          <blockquote
                            className="
                              text-center
                              text-lg sm:text-xl lg:text-2xl
                              text-[var(--foreground)]
                              leading-relaxed
                              max-w-3xl mx-auto
                            "
                          >
                            "{testimonial.content}"
                          </blockquote>

                          {/* Author */}
                          <div className="mt-[var(--spacing-xl)] flex flex-col items-center">
                            {/* Avatar */}
                            {testimonial.avatar ? (
                              <img
                                src={testimonial.avatar}
                                alt={testimonial.name}
                                className="
                                  w-14 h-14 sm:w-16 sm:h-16
                                  rounded-full object-cover
                                  border-2 border-[var(--accent)]
                                "
                              />
                            ) : (
                              <div
                                className="
                                  w-14 h-14 sm:w-16 sm:h-16
                                  rounded-full
                                  flex items-center justify-center
                                  bg-[var(--accent)] text-[var(--accent-foreground)]
                                  text-lg font-semibold
                                "
                              >
                                {getInitials(testimonial.name)}
                              </div>
                            )}

                            {/* Name & Title */}
                            <div className="mt-[var(--spacing-md)] text-center">
                              <p className="font-semibold text-[var(--foreground)]">
                                {testimonial.name}
                              </p>
                              {(testimonial.title || testimonial.company) && (
                                <p className="text-sm text-[var(--foreground-muted)]">
                                  {testimonial.title}
                                  {testimonial.title && testimonial.company && ', '}
                                  {testimonial.company}
                                </p>
                              )}
                              {testimonial.project && (
                                <p className="mt-[var(--spacing-xs)] text-xs text-[var(--accent)]">
                                  Proyecto: {testimonial.project}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {showControls && testimonials.length > 1 && (
              <>
                {controlsPosition === "sides" && (
                  <>
                    <CarouselPrevious />
                    <CarouselNext />
                  </>
                )}
                {controlsPosition === "bottom" && (
                  <div className="flex items-center justify-center gap-[var(--spacing-md)] mt-[var(--spacing-xl)]">
                    <CarouselPrevious />
                    <CarouselNext />
                  </div>
                )}
              </>
            )}

            {showDots && testimonials.length > 1 && (
              <CarouselDots className="mt-[var(--spacing-xl)]" />
            )}
          </Carousel>
        </div>
      </section>
    )
  }
)

TestimonialsSlider.displayName = 'TestimonialsSlider'

export default TestimonialsSlider
