import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps {
  variant?: 'rounded' | 'circular';
  width?: string | number;
  height?: string | number;
  /** `pulse` (default), `shimmer` gradient sweep, or `none` */
  animation?: 'pulse' | 'shimmer' | 'none';
  className?: string;
}

const animationClasses: Record<NonNullable<SkeletonProps['animation']>, string> = {
  pulse: 'animate-pulse',
  shimmer: [
    'animate-kreo-shimmer',
    'bg-[linear-gradient(90deg,var(--muted)_25%,color-mix(in_srgb,var(--muted)_70%,var(--foreground)_8%)_50%,var(--muted)_75%)]',
    'bg-[length:200%_100%]',
  ].join(' '),
  none: '',
};

const variantClasses: Record<NonNullable<SkeletonProps['variant']>, string> = {
  rounded: 'rounded-[var(--radius)]',
  circular: 'rounded-full',
};

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'rounded', animation = 'pulse', width, height, className = '' }, ref) => (
    <div
      ref={ref}
      className={cn(
        animation !== 'shimmer' && 'bg-[var(--muted)]',
        animationClasses[animation],
        variantClasses[variant],
        className,
      )}
      style={{
        width: width ?? '100%',
        height: height ?? '1rem',
      }}
      aria-hidden="true"
    />
  ),
);

Skeleton.displayName = 'Skeleton';

export default Skeleton;
