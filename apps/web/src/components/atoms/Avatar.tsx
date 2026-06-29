import { forwardRef, useState, type ReactNode } from 'react';
import { User } from 'lucide-react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
  featured?: boolean;
  children?: ReactNode;
  className?: string;
}

const sizeConfig = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', icon: 'w-3 h-3' },
  sm: { container: 'w-avatar-sm h-avatar-sm', text: 'text-xs', icon: 'w-4 h-4' },
  md: { container: 'w-avatar-md h-avatar-md', text: 'text-sm', icon: 'w-5 h-5' },
  lg: { container: 'w-avatar-lg h-avatar-lg', text: 'text-base', icon: 'w-6 h-6' },
  xl: { container: 'w-avatar-xl h-avatar-xl', text: 'text-lg', icon: 'w-8 h-8' },
  '2xl': { container: 'w-20 h-20', text: 'text-xl', icon: 'w-10 h-10' },
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = 'Avatar',
      name,
      size = 'md',
      shape = 'circle',
      children,
      className = '',
    },
    ref,
  ) => {
    const [imageError, setImageError] = useState(false);
    const config = sizeConfig[size];
    const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-[var(--radius)]';

    const renderContent = () => {
      if (children) return children;
      if (src && !imageError) {
        return (
          <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className={`h-full w-full object-cover ${shapeClass}`}
          />
        );
      }
      if (name) {
        return (
          <span className={`font-medium text-[var(--accent-foreground)] ${config.text}`}>
            {getInitials(name)}
          </span>
        );
      }
      return <User className={`text-[var(--foreground-muted)] ${config.icon}`} />;
    };

    return (
      <div
        ref={ref}
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-[var(--secondary)] ${config.container} ${shapeClass} ${className}`}
        style={name && (!src || imageError) ? { backgroundColor: 'var(--accent)' } : undefined}
      >
        {renderContent()}
      </div>
    );
  },
);

Avatar.displayName = 'Avatar';
export default Avatar;
