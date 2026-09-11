import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type FocusEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

export interface FocusRingGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  enabled?: boolean;
}

const FOCUSABLE =
  'input:not([type="hidden"]), textarea, select, button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Shared spring focus ring that jumps between fields in a form group. */
export const FocusRingGroup = forwardRef<HTMLDivElement, FocusRingGroupProps>(
  ({ children, className, enabled = true, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [ring, setRing] = useState({ x: 0, y: 0, w: 0, h: 0, visible: false });

    const positionRing = useCallback(
      (target: HTMLElement | null) => {
        const container = containerRef.current;
        if (!target || !container || !enabled) {
          setRing((r) => ({ ...r, visible: false }));
          return;
        }
        const cRect = container.getBoundingClientRect();
        const tRect = target.getBoundingClientRect();
        setRing({
          x: tRect.left - cRect.left,
          y: tRect.top - cRect.top,
          w: tRect.width,
          h: tRect.height,
          visible: true,
        });
      },
      [enabled],
    );

    const onFocusIn = useCallback(
      (e: FocusEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.matches(FOCUSABLE)) {
          positionRing(target);
        }
      },
      [positionRing],
    );

    const onFocusOut = useCallback((e: FocusEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;
      const next = e.relatedTarget as HTMLElement | null;
      if (!next || !container.contains(next)) {
        setRing((r) => ({ ...r, visible: false }));
      }
    }, []);

    return (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }}
        className={cn('relative', className)}
        onFocusCapture={onFocusIn}
        onBlurCapture={onFocusOut}
        {...props}
      >
        {enabled && (
          <span
            aria-hidden
            className="kreo-focus-ring"
            style={{
              transform: `translate(${ring.x}px, ${ring.y}px)`,
              width: ring.w,
              height: ring.h,
              opacity: ring.visible ? 1 : 0,
            }}
          />
        )}
        {children}
      </div>
    );
  },
);

FocusRingGroup.displayName = 'FocusRingGroup';

export default FocusRingGroup;
