import { Children, ReactNode, isValidElement, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type AnimationVariant =
  | 'fade-in'
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'zoom-in'
  | 'blur-in';

export interface RevealProps {
  children: ReactNode;
  variant?: AnimationVariant;
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  once?: boolean;
  staggerIndex?: number;
  staggerMs?: number;
  forceVisible?: boolean;
}

/** Animates children on scroll — premium entrance motion. */
export function Reveal({
  children,
  variant = 'fade-up',
  delay = 0,
  duration,
  threshold = 0.1,
  className,
  once = true,
  staggerIndex = 0,
  staggerMs = 90,
  forceVisible,
}: RevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const visible = forceVisible ?? isVisible;
  const totalDelay = delay + (staggerIndex * staggerMs) / 1000;

  useEffect(() => {
    if (forceVisible !== undefined) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [once, threshold, forceVisible]);

  const animationClasses = {
    'fade-in': 'animate-kreo-fade-in',
    'fade-up': 'animate-kreo-fade-up',
    'fade-down': 'animate-kreo-fade-down',
    'fade-left': 'animate-kreo-fade-left',
    'fade-right': 'animate-kreo-fade-right',
    'zoom-in': 'animate-kreo-zoom-in',
    'blur-in': 'animate-kreo-blur-in',
  };

  return (
    <div
      ref={ref}
      className={cn(!visible && 'opacity-0', visible && animationClasses[variant], className)}
      style={{
        animationDelay: `${totalDelay}s`,
        animationDuration: duration ? `${duration}s` : undefined,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}

export interface StaggerGroupProps {
  children: ReactNode;
  stagger?: number;
  variant?: AnimationVariant;
  threshold?: number;
  once?: boolean;
  className?: string;
}

/** Staggered scroll reveal for lists and page sections. */
export function StaggerGroup({
  children,
  stagger = 90,
  variant = 'fade-up',
  threshold = 0.1,
  once = true,
  className,
}: StaggerGroupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [once, threshold]);

  const items = Children.toArray(children);

  return (
    <div ref={ref} className={className}>
      {items.map((child, index) => {
        if (!isValidElement(child)) {
          return (
            <Reveal
              key={index}
              variant={variant}
              staggerIndex={index}
              staggerMs={stagger}
              forceVisible={isVisible}
            >
              {child}
            </Reveal>
          );
        }
        return (
          <Reveal
            key={child.key ?? index}
            variant={variant}
            staggerIndex={index}
            staggerMs={stagger}
            forceVisible={isVisible}
          >
            {child}
          </Reveal>
        );
      })}
    </div>
  );
}

export default Reveal;
