import { forwardRef, useState, type ReactNode } from 'react'
import { User } from 'lucide-react'

// ============================================
// TYPES
// ============================================
export interface AvatarProps {
  /** URL de la imagen */
  src?: string
  /** Texto alternativo */
  alt?: string
  /** Nombre para generar iniciales */
  name?: string
  /** Tamaño del avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Forma del avatar */
  shape?: 'circle' | 'square'
  /** Estado online/offline */
  status?: 'online' | 'offline' | 'busy' | 'away'
  /** Borde dorado (featured) */
  featured?: boolean
  /** Contenido personalizado dentro del avatar */
  children?: ReactNode
  /** Callback cuando la imagen falla */
  onError?: () => void
  /** Clases adicionales */
  className?: string
}

export interface AvatarGroupProps {
  /** Lista de avatares */
  avatars: Array<{
    src?: string
    name?: string
    alt?: string
  }>
  /** Tamaño de los avatares */
  size?: AvatarProps['size']
  /** Número máximo de avatares visibles */
  max?: number
  /** Clases adicionales */
  className?: string
}

// ============================================
// SIZE CONFIG
// ============================================
const sizeConfig = {
  xs: {
    container: 'w-6 h-6',
    text: 'text-[10px]',
    icon: 'w-3 h-3',
    status: 'w-1.5 h-1.5 border',
  },
  sm: {
    container: 'w-8 h-8',
    text: 'text-xs',
    icon: 'w-4 h-4',
    status: 'w-2 h-2 border',
  },
  md: {
    container: 'w-10 h-10',
    text: 'text-sm',
    icon: 'w-5 h-5',
    status: 'w-2.5 h-2.5 border-2',
  },
  lg: {
    container: 'w-12 h-12',
    text: 'text-base',
    icon: 'w-6 h-6',
    status: 'w-3 h-3 border-2',
  },
  xl: {
    container: 'w-16 h-16',
    text: 'text-lg',
    icon: 'w-8 h-8',
    status: 'w-3.5 h-3.5 border-2',
  },
  '2xl': {
    container: 'w-20 h-20',
    text: 'text-xl',
    icon: 'w-10 h-10',
    status: 'w-4 h-4 border-2',
  },
}

const statusColors = {
  online: 'bg-[var(--success)]',
  offline: 'bg-[var(--foreground-subtle)]',
  busy: 'bg-[var(--destructive)]',
  away: 'bg-[var(--warning)]',
}

// ============================================
// HELPERS
// ============================================
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ============================================
// AVATAR COMPONENT
// ============================================
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = 'Avatar',
      name,
      size = 'md',
      shape = 'circle',
      status,
      featured = false,
      children,
      onError,
      className = '',
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false)
    const config = sizeConfig[size]

    const handleImageError = () => {
      setImageError(true)
      onError?.()
    }

    const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-[var(--radius)]'

    // Render content (image, initials, or icon)
    const renderContent = () => {
      if (children) {
        return children
      }

      if (src && !imageError) {
        return (
          <img
            src={src}
            alt={alt}
            onError={handleImageError}
            className={`w-full h-full object-cover ${shapeClass}`}
          />
        )
      }

      if (name) {
        return (
          <span
            className={`font-medium text-[var(--accent-foreground)] ${config.text}`}
          >
            {getInitials(name)}
          </span>
        )
      }

      return <User className={`text-[var(--foreground-muted)] ${config.icon}`} />
    }

    return (
      <div
        ref={ref}
        className={`
          relative inline-flex items-center justify-center
          ${config.container}
          ${shapeClass}
          ${
            src && !imageError
              ? ''
              : 'bg-[var(--secondary)]'
          }
          ${
            featured
              ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)]'
              : ''
          }
          overflow-hidden
          shrink-0
          ${className}
        `}
        style={
          name && (!src || imageError)
            ? { backgroundColor: 'var(--accent)' }
            : undefined
        }
        data-testid="avatar"
      >
        {renderContent()}

        {/* Status indicator */}
        {status && (
          <span
            className={`
              absolute bottom-0 right-0
              ${config.status}
              ${shapeClass}
              ${statusColors[status]}
              border-[var(--background)]
            `}
            data-testid="avatar-status"
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

// ============================================
// AVATAR GROUP COMPONENT
// ============================================
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ avatars, size = 'md', max = 4, className = '' }, ref) => {
    const visibleAvatars = avatars.slice(0, max)
    const remainingCount = avatars.length - max
    const config = sizeConfig[size]

    return (
      <div
        ref={ref}
        className={`flex -space-x-2 ${className}`}
        data-testid="avatar-group"
      >
        {visibleAvatars.map((avatar, index) => (
          <Avatar
            key={index}
            src={avatar.src}
            name={avatar.name}
            alt={avatar.alt}
            size={size}
            className="ring-2 ring-[var(--background)]"
          />
        ))}

        {remainingCount > 0 && (
          <div
            className={`
              inline-flex items-center justify-center
              ${config.container}
              rounded-full
              bg-[var(--secondary)]
              ring-2 ring-[var(--background)]
            `}
          >
            <span className={`font-medium text-[var(--foreground-muted)] ${config.text}`}>
              +{remainingCount}
            </span>
          </div>
        )}
      </div>
    )
  }
)

AvatarGroup.displayName = 'AvatarGroup'

export default Avatar
