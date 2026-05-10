import { forwardRef, ReactNode } from 'react'
import { Check, X, Sparkles, ArrowRight } from 'lucide-react'

// ============================================
// TYPES
// ============================================
export interface PricingFeature {
  /** Nombre de la característica */
  name: string
  /** Disponible en este plan */
  included: boolean
  /** Texto adicional (ej: "Ilimitado", "5 usuarios") */
  value?: string
  /** Tooltip con más información */
  tooltip?: string
}

export interface PricingPlan {
  /** Identificador único */
  id: string
  /** Nombre del plan */
  name: string
  /** Descripción corta */
  description: string
  /** Precio (número o string para "Personalizado") */
  price: number | string
  /** Periodo de facturación */
  period?: 'mes' | 'año' | 'proyecto' | 'único'
  /** Moneda */
  currency?: string
  /** Características incluidas */
  features: PricingFeature[]
  /** Plan destacado/recomendado */
  featured?: boolean
  /** Etiqueta especial (ej: "Más popular", "Mejor valor") */
  badge?: string
  /** Texto del botón CTA */
  ctaText?: string
  /** Acción del botón */
  onSelect?: () => void
  /** Enlace del botón */
  href?: string
}

export interface PricingTableProps {
  /** Título de la sección */
  title?: ReactNode
  /** Subtítulo */
  subtitle?: string
  /** Badge superior */
  badge?: string
  /** Lista de planes */
  plans: PricingPlan[]
  /** Mostrar toggle anual/mensual */
  showBillingToggle?: boolean
  /** Callback cuando cambia el billing */
  onBillingChange?: (period: 'mes' | 'año') => void
  /** Billing actual seleccionado */
  billingPeriod?: 'mes' | 'año'
  /** Variante visual */
  variant?: 'cards' | 'table'
  /** Clases adicionales */
  className?: string
}

// ============================================
// DEFAULT PLANS (Construction Company Example)
// ============================================
export const defaultConstructionPlans: PricingPlan[] = [
  {
    id: 'basico',
    name: 'Básico',
    description: 'Ideal para remodelaciones pequeñas',
    price: 25000,
    period: 'proyecto',
    currency: 'MXN',
    features: [
      { name: 'Diseño arquitectónico', included: true },
      { name: 'Planos estructurales', included: true },
      { name: 'Supervisión de obra', included: false },
      { name: 'Renders 3D', included: false },
      { name: 'Asesoría personalizada', included: false },
    ],
    ctaText: 'Solicitar cotización',
  },
  {
    id: 'profesional',
    name: 'Profesional',
    description: 'Para proyectos residenciales completos',
    price: 85000,
    period: 'proyecto',
    currency: 'MXN',
    featured: true,
    badge: 'Más popular',
    features: [
      { name: 'Diseño arquitectónico', included: true },
      { name: 'Planos estructurales', included: true },
      { name: 'Supervisión de obra', included: true },
      { name: 'Renders 3D', included: true, value: '3 renders' },
      { name: 'Asesoría personalizada', included: false },
    ],
    ctaText: 'Comenzar proyecto',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Servicio integral llave en mano',
    price: 'Personalizado',
    period: 'proyecto',
    currency: 'MXN',
    features: [
      { name: 'Diseño arquitectónico', included: true },
      { name: 'Planos estructurales', included: true },
      { name: 'Supervisión de obra', included: true },
      { name: 'Renders 3D', included: true, value: 'Ilimitados' },
      { name: 'Asesoría personalizada', included: true },
    ],
    ctaText: 'Contactar',
  },
]

// ============================================
// COMPONENT
// ============================================
export const PricingTable = forwardRef<HTMLElement, PricingTableProps>(
  (
    {
      title = 'Planes y Precios',
      subtitle,
      badge,
      plans = defaultConstructionPlans,
      showBillingToggle = false,
      onBillingChange,
      billingPeriod = 'mes',
      variant: _variant = 'cards',
      className = '',
    },
    ref
  ) => {
    // Format price
    const formatPrice = (
      price: number | string,
      currency: string = 'MXN'
    ): string => {
      if (typeof price === 'string') return price
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price)
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
        data-testid="pricing-table"
      >
        <div className="max-w-7xl mx-auto">
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
                <Sparkles className="w-3 h-3" />
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

            {/* Billing Toggle */}
            {showBillingToggle && (
              <div className="mt-[var(--spacing-xl)] inline-flex items-center gap-[var(--spacing-md)] p-[var(--spacing-xs)] rounded-full bg-[var(--secondary)] border border-[var(--border)]">
                <button
                  onClick={() => onBillingChange?.('mes')}
                  className={`
                    px-[var(--spacing-md)] py-[var(--spacing-sm)] text-sm font-medium rounded-full
                    transition-all duration-[var(--transition-base)]
                    ${billingPeriod === 'mes'
                      ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }
                  `}
                >
                  Mensual
                </button>
                <button
                  onClick={() => onBillingChange?.('año')}
                  className={`
                    px-[var(--spacing-md)] py-[var(--spacing-sm)] text-sm font-medium rounded-full
                    transition-all duration-[var(--transition-base)]
                    ${billingPeriod === 'año'
                      ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }
                  `}
                >
                  Anual
                  <span className="ml-[var(--spacing-xs)] text-xs text-[var(--success)]">-20%</span>
                </button>
              </div>
            )}
          </header>

          {/* Pricing Cards */}
          <div
            className={`
              grid grid-cols-1 
              ${plans.length === 2 ? 'md:grid-cols-2 max-w-4xl' : 'md:grid-cols-2 lg:grid-cols-3'}
              gap-[var(--spacing-lg)] sm:gap-8
              mx-auto
            `}
          >
            {plans.map((plan) => {
              const ButtonWrapper = plan.href ? 'a' : 'button'
              const buttonProps = plan.href
                ? { href: plan.href }
                : { onClick: plan.onSelect }

              return (
                <div
                  key={plan.id}
                  className={`
                    relative flex flex-col
                    p-[var(--spacing-lg)] sm:p-8
                    rounded-[var(--radius-lg)]
                    border
                    transition-all duration-[var(--transition-base)]
                    ${plan.featured
                      ? `
                          bg-gradient-to-b from-[var(--card)] to-[var(--secondary)]
                          border-[var(--accent)]
                          shadow-lg shadow-[var(--accent)]/10
                          scale-[1.02] lg:scale-105
                        `
                      : `
                          bg-[var(--card)]
                          border-[var(--card-border)]
                          hover:border-[var(--border-hover)]
                        `
                    }
                  `}
                  data-testid={`pricing-plan-${plan.id}`}
                >
                  {/* Featured Badge */}
                  {plan.badge && (
                    <div
                      className="
                        absolute -top-3 left-1/2 -translate-x-1/2
                        px-[var(--spacing-md)] py-[var(--spacing-xs)]
                        text-xs font-semibold
                        rounded-full
                        bg-[var(--accent)] text-[var(--accent-foreground)]
                        shadow-md
                      "
                    >
                      {plan.badge}
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-[var(--spacing-lg)]">
                    <h3 className="text-xl font-semibold text-[var(--foreground)]">
                      {plan.name}
                    </h3>
                    <p className="mt-[var(--spacing-xs)] text-sm text-[var(--foreground-muted)]">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-[var(--spacing-lg)] pb-[var(--spacing-lg)] border-b border-[var(--border)]">
                    <div className="flex items-baseline justify-center gap-[var(--spacing-xs)]">
                      {typeof plan.price === 'number' && (
                        <span className="text-sm text-[var(--foreground-muted)]">
                          {plan.currency}
                        </span>
                      )}
                      <span
                        className={`
                          font-bold text-[var(--foreground)]
                          ${typeof plan.price === 'number' ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'}
                        `}
                        style={{ fontFamily: 'var(--font-display), serif' }}
                      >
                        {formatPrice(plan.price, plan.currency)}
                      </span>
                    </div>
                    {plan.period && typeof plan.price === 'number' && (
                      <span className="text-sm text-[var(--foreground-muted)]">
                        / {plan.period}
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="flex-1 space-y-[var(--spacing-md)] mb-[var(--spacing-xl)]">
                    {plan.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-[var(--spacing-md)] text-sm"
                      >
                        {feature.included ? (
                          <Check className="w-5 h-5 text-[var(--success)] shrink-0 mt-[var(--spacing-xxs)]" />
                        ) : (
                          <X className="w-5 h-5 text-[var(--foreground-subtle)] shrink-0 mt-[var(--spacing-xxs)]" />
                        )}
                        <span
                          className={
                            feature.included
                              ? 'text-[var(--foreground)]'
                              : 'text-[var(--foreground-subtle)]'
                          }
                        >
                          {feature.name}
                          {feature.value && (
                            <span className="ml-[var(--spacing-xs)] text-[var(--accent)]">
                              ({feature.value})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <ButtonWrapper
                    {...buttonProps}
                    className={`
                      w-full
                      flex items-center justify-center gap-[var(--spacing-sm)]
                      px-[var(--spacing-lg)] py-[var(--spacing-md)]
                      text-sm font-semibold
                      rounded-[var(--radius)]
                      transition-all duration-[var(--transition-base)]
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
                      ${plan.featured
                        ? `
                            bg-[var(--primary)] text-[var(--primary-foreground)]
                            hover:bg-[var(--primary-hover)]
                            shadow-md hover:shadow-lg
                          `
                        : `
                            bg-transparent text-[var(--foreground)]
                            border border-[var(--border)]
                            hover:bg-[var(--secondary)] hover:border-[var(--border-hover)]
                          `
                      }
                    `}
                  >
                    {plan.ctaText || 'Seleccionar'}
                    <ArrowRight className="w-4 h-4" />
                  </ButtonWrapper>
                </div>
              )
            })}
          </div>

          {/* Footer note */}
          <p className="mt-[var(--spacing-2xl)] text-center text-sm text-[var(--foreground-subtle)]">
            Todos los precios son en pesos mexicanos (MXN) y no incluyen IVA.
            <br />
            <a
              href="#contact"
              className="text-[var(--accent)] hover:underline"
            >
              Contáctanos
            </a>{' '}
            para proyectos especiales o presupuestos personalizados.
          </p>
        </div>
      </section>
    )
  }
)

PricingTable.displayName = 'PricingTable'

export default PricingTable
