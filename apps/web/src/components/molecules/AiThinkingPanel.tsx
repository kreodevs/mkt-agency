import { cn } from '@/lib/utils';
import { Loader } from '@/components/atoms/Loader';
import type { OrbState } from '@/components/atoms/thinking-orb';

export interface AiThinkingPanelProps {
  title: string;
  description?: string;
  state?: OrbState;
  variant?: 'card' | 'inline' | 'centered';
  className?: string;
}

/** AI/agent loading state with ThinkingOrb — use in copilot, brand interview, image gen. */
export function AiThinkingPanel({
  title,
  description,
  state = 'working',
  variant = 'card',
  className,
}: AiThinkingPanelProps) {
  if (variant === 'centered') {
    return (
      <div
        className={cn(
          'flex min-h-[40vh] flex-col items-center justify-center gap-[var(--spacing-md)] text-center',
          className,
        )}
      >
        <Loader variant="orb" state={state} size="md" />
        <div className="max-w-sm space-y-1">
          <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
          {description && (
            <p className="text-xs leading-relaxed text-[var(--foreground-muted)]">{description}</p>
          )}
        </div>
      </div>
    );
  }

  const content = (
    <div className={cn('flex items-start gap-[var(--spacing-md)]', className)}>
      <Loader variant="orb" state={state} size="md" className="shrink-0" />
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        {description && (
          <p className="text-xs leading-relaxed text-[var(--foreground-muted)]">{description}</p>
        )}
      </div>
    </div>
  );

  if (variant === 'inline') return content;

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--brand)]/20 bg-[var(--brand-muted)]/50 p-[var(--spacing-md)]">
      {content}
    </div>
  );
}

export default AiThinkingPanel;
