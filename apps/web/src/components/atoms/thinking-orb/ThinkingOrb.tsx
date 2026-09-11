import { ThinkingOrb as ThinkingOrbPrimitive } from 'thinking-orbs';
import { cn } from '@/lib/utils';
import type { ThinkingOrbProps } from './types';
import { ORB_STATE_LABELS } from './types';

/** Dotted thought-orb for AI/agent loading states. Wraps `thinking-orbs` with Kreo a11y defaults. */
export function ThinkingOrb({
  state = 'working',
  size = 64,
  theme = 'auto',
  speed = 1,
  paused = false,
  label,
  className,
  'aria-label': ariaLabel,
  ...props
}: ThinkingOrbProps) {
  const resolvedLabel = label ?? ariaLabel ?? ORB_STATE_LABELS[state];

  return (
    <ThinkingOrbPrimitive
      state={state}
      size={size}
      theme={theme}
      speed={speed}
      paused={paused}
      aria-label={resolvedLabel}
      role="img"
      className={cn('inline-block shrink-0', className)}
      {...props}
    />
  );
}

ThinkingOrb.displayName = 'ThinkingOrb';

export default ThinkingOrb;
