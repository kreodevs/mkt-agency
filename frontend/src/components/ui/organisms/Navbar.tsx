import { forwardRef, useState, useEffect, ReactNode } from 'react'
import { Menu, X, ChevronDown, ExternalLink } from 'lucide-react'

// ============================================
// TYPES
// ============================================
export interface NavLink {
  /** Texto del enlace */
  label: string
  /** URL */
  href: string
  /** Abrir en nueva pestaña */
  external?: boolean
  /** Submenú de enlaces */
  children?: NavLink[]
}

export interface NavbarProps {
  /** Logo o nombre de la empresa */
  logo?: ReactNode
  /** Lista de enlaces de navegación */
  links?: NavLink[]
  /** Botón CTA (Call to Action) */
  cta?: {
    label: string
    href?: string
    onClick?: () => void
  }
  /** Navbar transparente (para heros con imagen) */
  transparent?: boolean
  /** Mostrar efecto de scroll (fondo sólido al hacer scroll) */
  scrollEffect?: boolean
  /** Umbral de scroll para activar el efecto (px) */
  scrollThreshold?: number
  /** Sticky en la parte superior */
  sticky?: boolean
  /** Variante visual */
  variant?: 'default' | 'centered' | 'minimal'
  /** Clases adicionales */
  className?: string
}

// ============================================
// DEFAULT LINKS
// ============================================
export const defaultNavLinks: NavLink[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Proyectos', href: '/proyectos' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Contacto', href: '/contacto' },
]

// ============================================
// COMPONENT
// ============================================
export const Navbar = forwardRef<HTMLElement, NavbarProps>(
  (
    {
      logo,
      links = defaultNavLinks,
      cta,
      transparent = false,
      scrollEffect = true,
      scrollThreshold = 50,
      sticky = true,
      variant = 'default',
      className = '',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)

    // Handle scroll effect
    useEffect(() => {
      if (!scrollEffect) return

      const handleScroll = () => {
        setIsScrolled(window.scrollY > scrollThreshold)
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll() // Check initial state

      return () => window.removeEventListener('scroll', handleScroll)
    }, [scrollEffect, scrollThreshold])

    // Close mobile menu on resize
    useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth >= 1024) {
          setIsOpen(false)
        }
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Background styles based on state
    const getBackgroundStyles = () => {
      if (transparent && !isScrolled && !isOpen) {
        return 'bg-transparent'
      }
      return 'bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)]'
    }

    // Render link
    const renderLink = (link: NavLink, isMobile = false) => {
      const hasChildren = link.children && link.children.length > 0
      const isDropdownOpen = openDropdown === link.label

      const linkStyles = isMobile
        ? `
          block w-full px-[var(--spacing-md)] py-[var(--spacing-md)]
          text-base font-medium
          text-[var(--foreground)]
          hover:bg-[var(--secondary)]
          transition-colors duration-[var(--transition-fast)]
        `
        : `
          relative px-[var(--spacing-md)] py-[var(--spacing-sm)]
          text-sm font-medium
          text-[var(--foreground-muted)]
          hover:text-[var(--foreground)]
          transition-colors duration-[var(--transition-fast)]
        `

      if (hasChildren) {
        return (
          <div
            key={link.label}
            className={isMobile ? 'w-full' : 'relative'}
            onMouseEnter={() => !isMobile && setOpenDropdown(link.label)}
            onMouseLeave={() => !isMobile && setOpenDropdown(null)}
          >
            <button
              onClick={() => isMobile && setOpenDropdown(isDropdownOpen ? null : link.label)}
              className={`
                ${linkStyles}
                inline-flex items-center gap-[var(--spacing-xs)]
                ${isMobile ? 'justify-between' : ''}
              `}
            >
              {link.label}
              <ChevronDown
                className={`
                  w-4 h-4
                  transition-transform duration-[var(--transition-fast)]
                  ${isDropdownOpen ? 'rotate-180' : ''}
                `}
              />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div
                className={`
                  ${isMobile ? 'pl-[var(--spacing-md)] border-l border-[var(--border)] ml-[var(--spacing-md)]' : `
                    absolute top-full left-0 mt-[var(--spacing-xs)]
                    min-w-[200px]
                    rounded-[var(--radius)]
                    bg-[var(--popover)]
                    border border-[var(--border)]
                    shadow-lg
                    z-[var(--z-dropdown)]
                    py-[var(--spacing-xs)]
                  `}
                `}
              >
                {link.children!.map((child) => (
                  <a
                    key={child.label}
                    href={child.href}
                    target={child.external ? '_blank' : undefined}
                    rel={child.external ? 'noopener noreferrer' : undefined}
                    className={`
                      flex items-center gap-[var(--spacing-sm)]
                      px-[var(--spacing-md)] py-[var(--spacing-sm)]
                      text-sm
                      text-[var(--foreground-muted)]
                      hover:text-[var(--foreground)]
                      hover:bg-[var(--secondary)]
                      transition-colors duration-[var(--transition-fast)]
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    {child.label}
                    {child.external && <ExternalLink className="w-3 h-3" />}
                  </a>
                ))}
              </div>
            )}
          </div>
        )
      }

      return (
        <a
          key={link.label}
          href={link.href}
          target={link.external ? '_blank' : undefined}
          rel={link.external ? 'noopener noreferrer' : undefined}
          className={`
            ${linkStyles}
            inline-flex items-center gap-[var(--spacing-xs)]
          `}
          onClick={() => setIsOpen(false)}
        >
          {link.label}
          {link.external && <ExternalLink className="w-3 h-3" />}
        </a>
      )
    }

    return (
      <nav
        ref={ref}
        className={`
          ${sticky ? 'fixed top-0 left-0 right-0 z-[var(--z-sticky)]' : 'relative'}
          transition-all duration-[var(--transition-base)]
          ${getBackgroundStyles()}
          ${className}
        `}
        data-testid="navbar"
      >
        <div className="max-w-7xl mx-auto px-[var(--spacing-md)] sm:px-6 lg:px-8">
          <div
            className={`
              flex items-center h-16 sm:h-18
              ${variant === 'centered' ? 'justify-center' : 'justify-between'}
            `}
          >
            {/* Logo */}
            <div className={variant === 'centered' ? 'absolute left-4 sm:left-6' : ''}>
              {logo || (
                <a href="/" className="flex items-center gap-[var(--spacing-sm)]">
                  <div
                    className="
                      w-9 h-9
                      rounded-[var(--radius)]
                      bg-[var(--accent)]
                      flex items-center justify-center
                    "
                  >
                    <span
                      className="text-lg font-bold text-[var(--accent-foreground)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      C
                    </span>
                  </div>
                  <span
                    className="text-lg font-semibold text-[var(--foreground)] hidden sm:block"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Corporate
                  </span>
                </a>
              )}
            </div>

            {/* Desktop Navigation */}
            <div
              className={`
                hidden lg:flex items-center gap-[var(--spacing-xs)]
                ${variant === 'centered' ? '' : 'ml-[var(--spacing-xl)]'}
              `}
            >
              {links.map((link) => renderLink(link))}
            </div>

            {/* CTA Button - Desktop */}
            {cta && (
              <div
                className={`
                  hidden lg:block
                  ${variant === 'centered' ? 'absolute right-4 sm:right-6' : ''}
                `}
              >
                {cta.href ? (
                  <a
                    href={cta.href}
                    className="
                      inline-flex items-center justify-center
                      px-[var(--spacing-lg)] py-2.5
                      text-sm font-semibold
                      rounded-[var(--radius)]
                      bg-[var(--primary)] text-[var(--primary-foreground)]
                      hover:bg-[var(--primary-hover)]
                      transition-colors duration-[var(--transition-base)]
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
                    "
                  >
                    {cta.label}
                  </a>
                ) : (
                  <button
                    onClick={cta.onClick}
                    className="
                      inline-flex items-center justify-center
                      px-[var(--spacing-lg)] py-2.5
                      text-sm font-semibold
                      rounded-[var(--radius)]
                      bg-[var(--primary)] text-[var(--primary-foreground)]
                      hover:bg-[var(--primary-hover)]
                      transition-colors duration-[var(--transition-base)]
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
                    "
                  >
                    {cta.label}
                  </button>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="
                lg:hidden
                p-[var(--spacing-sm)]
                rounded-[var(--radius)]
                text-[var(--foreground)]
                hover:bg-[var(--secondary)]
                transition-colors duration-[var(--transition-fast)]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
              "
              aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`
            lg:hidden
            overflow-hidden
            transition-all duration-[var(--transition-base)]
            ${isOpen ? 'max-h-[400px] border-t border-[var(--border)]' : 'max-h-0'}
          `}
        >
          <div className="px-[var(--spacing-sm)] py-[var(--spacing-md)] space-y-[var(--spacing-xs)] bg-[var(--background)]">
            {links.map((link) => renderLink(link, true))}

            {/* CTA Button - Mobile */}
            {cta && (
              <div className="px-[var(--spacing-md)] pt-[var(--spacing-md)]">
                {cta.href ? (
                  <a
                    href={cta.href}
                    className="
                      flex items-center justify-center
                      w-full px-[var(--spacing-lg)] py-[var(--spacing-md)]
                      text-sm font-semibold
                      rounded-[var(--radius)]
                      bg-[var(--primary)] text-[var(--primary-foreground)]
                      hover:bg-[var(--primary-hover)]
                      transition-colors duration-[var(--transition-base)]
                    "
                    onClick={() => setIsOpen(false)}
                  >
                    {cta.label}
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      cta.onClick?.()
                      setIsOpen(false)
                    }}
                    className="
                      flex items-center justify-center
                      w-full px-[var(--spacing-lg)] py-[var(--spacing-md)]
                      text-sm font-semibold
                      rounded-[var(--radius)]
                      bg-[var(--primary)] text-[var(--primary-foreground)]
                      hover:bg-[var(--primary-hover)]
                      transition-colors duration-[var(--transition-base)]
                    "
                  >
                    {cta.label}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    )
  }
)

Navbar.displayName = 'Navbar'

export default Navbar
