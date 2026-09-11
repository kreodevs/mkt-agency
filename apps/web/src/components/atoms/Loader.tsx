import { Loader2 } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ThinkingOrb } from './thinking-orb';
import type { OrbState } from './thinking-orb';
import { Skeleton } from './Skeleton';

const loaderVariants = cva('inline-flex items-center justify-center', {
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const spinnerSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const;

const orbSizeMap = {
  sm: 20,
  md: 64,
  lg: 64,
} as const;

export type LoaderVariant = 'spinner' | 'orb' | 'skeleton';
export type LoaderSize = 'sm' | 'md' | 'lg';

export interface LoaderProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>,
    VariantProps<typeof loaderVariants> {
  variant?: LoaderVariant;
  size?: LoaderSize;
  state?: OrbState;
  label?: string;
  paused?: boolean;
  skeletonWidth?: string | number;
  skeletonHeight?: string | number;
}

/** Unified loading indicator: spinner (actions), orb (AI), skeleton (placeholders). */
export const Loader = forwardRef<HTMLDivElement, LoaderProps>(
  (
    {
      variant = 'spinner',
      size = 'md',
      state = 'working',
      label,
      paused = false,
      skeletonWidth,
      skeletonHeight,
      className,
      ...props
    },
    ref,
  ) => {
    const resolvedSize = size ?? 'md';

    if (variant === 'orb') {
      return (
        <div
          ref={ref}
          className={cn(loaderVariants({ size: resolvedSize }), className)}
          {...props}
        >
          <ThinkingOrb
            state={state}
            size={orbSizeMap[resolvedSize]}
            paused={paused}
            label={label}
          />
        </div>
      );
    }

    if (variant === 'skeleton') {
      return (
        <div ref={ref} className={cn(loaderVariants({ size: resolvedSize }), className)} {...props}>
          <Skeleton
            variant="rounded"
            animation="pulse"
            width={skeletonWidth}
            height={
              skeletonHeight ??
              (resolvedSize === 'sm' ? '1rem' : resolvedSize === 'lg' ? '2rem' : '1.5rem')
            }
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="status"
        aria-label={label ?? 'Cargando…'}
        className={cn(loaderVariants({ size: resolvedSize }), className)}
        {...props}
      >
        <Loader2
          className={cn(
            spinnerSizeClasses[resolvedSize],
            'animate-spin text-[var(--primary)] motion-reduce:animate-none',
          )}
          aria-hidden
        />
      </div>
    );
  },
);

Loader.displayName = 'Loader';

export default Loader;
