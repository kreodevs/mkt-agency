import { forwardRef, ReactNode } from 'react'
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================
export interface FooterLink {
  /** Texto del enlace */
  label: string
  /** URL */
  href: string
  /** Abrir en nueva pestaña */
  external?: boolean
}

export interface FooterLinkGroup {
  /** Título del grupo */
  title: string
  /** Lista de enlaces */
  links: FooterLink[]
}

export interface SocialLink {
  /** Plataforma */
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'other'
  /** URL */
  href: string
  /** Icono personalizado (si es 'other') */
  icon?: LucideIcon
  /** Label para accesibilidad */
  label?: string
}

export interface FooterProps {
  /** Logo o nombre de la empresa */
  logo?: ReactNode
  /** Descripción de la empresa */
  description?: string
  /** Grupos de enlaces */
  linkGroups?: FooterLinkGroup[]
  /** Información de contacto */
  contact?: {
    email?: string
    phone?: string
    address?: string
  }
  /** Redes sociales */
  socialLinks?: SocialLink[]
  /** Texto de copyright */
  copyright?: string
  /** Enlace de política de privacidad */
  privacyLink?: string
  /** Enlace de términos */
  termsLink?: string
  /** Variante visual */
  variant?: 'default' | 'minimal' | 'centered'
  /** Clases adicionales */
  className?: string
}

// ============================================
// SOCIAL ICONS MAP
// ============================================
const socialIcons: Record<string, LucideIcon> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
}

// ============================================
// DEFAULT DATA (Construction Company)
// ============================================
export const defaultLinkGroups: FooterLinkGroup[] = [
  {
    title: 'Servicios',
    links: [
      { label: 'Construcción Residencial', href: '/servicios/residencial' },
      { label: 'Proyectos Comerciales', href: '/servicios/comercial' },
      { label: 'Remodelaciones', href: '/servicios/remodelaciones' },
      { label: 'Diseño Arquitectónico', href: '/servicios/diseno' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre Nosotros', href: '/nosotros' },
      { label: 'Proyectos', href: '/proyectos' },
      { label: 'Testimonios', href: '/testimonios' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { label: 'Guía de Construcción', href: '/recursos/guia' },
      { label: 'Preguntas Frecuentes', href: '/faq' },
      { label: 'Cotizador en Línea', href: '/cotizador' },
      { label: 'Contacto', href: '/contacto' },
    ],
  },
]

export const defaultSocialLinks: SocialLink[] = [
  { platform: 'facebook', href: 'https://facebook.com', label: 'Facebook' },
  { platform: 'instagram', href: 'https://instagram.com', label: 'Instagram' },
  { platform: 'linkedin', href: 'https://linkedin.com', label: 'LinkedIn' },
  { platform: 'youtube', href: 'https://youtube.com', label: 'YouTube' },
]

// ============================================
// COMPONENT
// ============================================
export const Footer = forwardRef<HTMLElement, FooterProps>(
  (
    {
      logo,
      description = 'Construimos sueños con excelencia. Más de 20 años transformando espacios y creando hogares excepcionales.',
      linkGroups = defaultLinkGroups,
      contact = {
        email: 'contacto@constructora.com',
        phone: '+52 55 1234 5678',
        address: 'Av. Reforma 222, Col. Juárez, CDMX',
      },
      socialLinks = defaultSocialLinks,
      copyright = `© ${new Date().getFullYear()} Constructora Premium. Todos los derechos reservados.`,
      privacyLink = '/privacidad',
      termsLink = '/terminos',
      variant = 'default',
      className = '',
    },
    ref
  ) => {
    return (
      <footer
        ref={ref}
        className={`
          bg-[var(--background)]
          border-t border-[var(--border)]
          ${className}
        `}
        data-testid="footer"
      >
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-[var(--spacing-md)] sm:px-6 lg:px-8 py-[var(--spacing-2xl)] sm:py-16">
          <div
            className={`
              grid gap-[var(--spacing-2xl)] lg:gap-16
              ${variant === 'centered' ? 'text-center' : ''}
              ${variant === 'minimal' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-12'}
            `}
          >
            {/* Brand Column */}
            <div
              className={`
                ${variant === 'minimal' ? '' : 'lg:col-span-4'}
                ${variant === 'centered' ? 'flex flex-col items-center' : ''}
              `}
            >
              {/* Logo */}
              <div className="mb-[var(--spacing-md)]">
                {logo || (
                  <div className="flex items-center gap-[var(--spacing-sm)]">
                    <div
                      className="
                        w-10 h-10
                        rounded-[var(--radius)]
                        bg-[var(--accent)]
                        flex items-center justify-center
                      "
                    >
                      <span
                        className="text-xl font-bold text-[var(--accent-foreground)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        C
                      </span>
                    </div>
                    <span
                      className="text-xl font-semibold text-[var(--foreground)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Constructora
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {description && (
                <p
                  className={`
                    text-sm text-[var(--foreground-muted)]
                    leading-relaxed
                    ${variant === 'centered' ? 'max-w-md' : 'max-w-xs'}
                  `}
                >
                  {description}
                </p>
              )}

              {/* Social Links */}
              {socialLinks && socialLinks.length > 0 && (
                <div
                  className={`
                    flex gap-[var(--spacing-md)] mt-[var(--spacing-lg)]
                    ${variant === 'centered' ? 'justify-center' : ''}
                  `}
                >
                  {socialLinks.map((social) => {
                    const Icon =
                      social.platform === 'other' && social.icon
                        ? social.icon
                        : socialIcons[social.platform]

                    return (
                      <a
                        key={social.platform}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          w-10 h-10
                          flex items-center justify-center
                          rounded-full
                          bg-[var(--secondary)]
                          border border-[var(--border)]
                          text-[var(--foreground-muted)]
                          hover:text-[var(--accent)] hover:border-[var(--accent)]
                          transition-all duration-[var(--transition-base)]
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
                        "
                        aria-label={social.label || social.platform}
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Link Groups */}
            {variant !== 'minimal' && linkGroups && linkGroups.length > 0 && (
              <div
                className={`
                  lg:col-span-5
                  grid grid-cols-2 sm:grid-cols-3 gap-[var(--spacing-xl)]
                  ${variant === 'centered' ? 'justify-items-center' : ''}
                `}
              >
                {linkGroups.map((group) => (
                  <div key={group.title}>
                    <h4 className="text-sm font-semibold text-[var(--foreground)] mb-[var(--spacing-md)]">
                      {group.title}
                    </h4>
                    <ul className="space-y-[var(--spacing-md)]">
                      {group.links.map((link) => (
                        <li key={link.label}>
                          <a
                            href={link.href}
                            target={link.external ? '_blank' : undefined}
                            rel={link.external ? 'noopener noreferrer' : undefined}
                            className="
                              inline-flex items-center gap-[var(--spacing-xs)]
                              text-sm text-[var(--foreground-muted)]
                              hover:text-[var(--accent)]
                              transition-colors duration-[var(--transition-base)]
                            "
                          >
                            {link.label}
                            {link.external && (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Contact Info */}
            {variant !== 'minimal' && contact && (
              <div
                className={`
                  lg:col-span-3
                  ${variant === 'centered' ? 'flex flex-col items-center' : ''}
                `}
              >
                <h4 className="text-sm font-semibold text-[var(--foreground)] mb-[var(--spacing-md)]">
                  Contacto
                </h4>
                <ul className="space-y-[var(--spacing-md)]">
                  {contact.email && (
                    <li>
                      <a
                        href={`mailto:${contact.email}`}
                        className="
                          inline-flex items-center gap-[var(--spacing-sm)]
                          text-sm text-[var(--foreground-muted)]
                          hover:text-[var(--accent)]
                          transition-colors duration-[var(--transition-base)]
                        "
                      >
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </a>
                    </li>
                  )}
                  {contact.phone && (
                    <li>
                      <a
                        href={`tel:${contact.phone.replace(/\s/g, '')}`}
                        className="
                          inline-flex items-center gap-[var(--spacing-sm)]
                          text-sm text-[var(--foreground-muted)]
                          hover:text-[var(--accent)]
                          transition-colors duration-[var(--transition-base)]
                        "
                      >
                        <Phone className="w-4 h-4" />
                        {contact.phone}
                      </a>
                    </li>
                  )}
                  {contact.address && (
                    <li
                      className={`
                        flex items-start gap-[var(--spacing-sm)]
                        text-sm text-[var(--foreground-muted)]
                        ${variant === 'centered' ? 'text-center' : ''}
                      `}
                    >
                      <MapPin className="w-4 h-4 shrink-0 mt-[var(--spacing-xxs)]" />
                      <span>{contact.address}</span>
                    </li>
                  )}
                </ul>

                {/* Newsletter CTA (optional enhancement) */}
                <div className="mt-[var(--spacing-lg)] pt-[var(--spacing-lg)] border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--foreground-subtle)] mb-[var(--spacing-md)]">
                    Suscríbete a nuestro boletín
                  </p>
                  <div className="flex gap-[var(--spacing-sm)]">
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      className="
                        flex-1 h-9
                        px-[var(--spacing-md)] text-sm
                        rounded-[var(--radius)]
                        bg-[var(--secondary)]
                        border border-[var(--border)]
                        text-[var(--foreground)]
                        placeholder:text-[var(--foreground-subtle)]
                        focus:outline-none focus:ring-1 focus:ring-[var(--ring)]
                      "
                    />
                    <button
                      className="
                        px-[var(--spacing-md)] h-9
                        text-sm font-medium
                        rounded-[var(--radius)]
                        bg-[var(--accent)] text-[var(--accent-foreground)]
                        hover:bg-[var(--primary-hover)]
                        transition-colors duration-[var(--transition-base)]
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
                      "
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[var(--border)]">
          <div
            className="
              max-w-7xl mx-auto
              px-[var(--spacing-md)] sm:px-6 lg:px-8
              py-[var(--spacing-md)] sm:py-6
              flex flex-col sm:flex-row items-center justify-between gap-[var(--spacing-md)]
            "
          >
            {/* Copyright */}
            <p className="text-xs text-[var(--foreground-subtle)] text-center sm:text-left">
              {copyright}
            </p>

            {/* Legal Links */}
            <div className="flex items-center gap-[var(--spacing-md)] sm:gap-6">
              {privacyLink && (
                <a
                  href={privacyLink}
                  className="
                    text-xs text-[var(--foreground-subtle)]
                    hover:text-[var(--foreground-muted)]
                    transition-colors
                  "
                >
                  Política de Privacidad
                </a>
              )}
              {termsLink && (
                <a
                  href={termsLink}
                  className="
                    text-xs text-[var(--foreground-subtle)]
                    hover:text-[var(--foreground-muted)]
                    transition-colors
                  "
                >
                  Términos y Condiciones
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Decorative top accent line */}
        <div
          className="h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--accent), transparent)',
          }}
        />
      </footer>
    )
  }
)

Footer.displayName = 'Footer'

export default Footer
