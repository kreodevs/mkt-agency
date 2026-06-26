import type { ContentStatus } from '@/types/content';
import { StatusPill } from '@/components/atoms/StatusPill';
import { calendarStatusColor, calendarStatusLabel } from '@/lib/calendar-status';

function statusVariant(status: ContentStatus) {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'error';
  if (status === 'in_review') return 'info';
  if (status === 'in_changes') return 'warning';
  return 'neutral';
}

interface StatusBadgeProps {
  status: ContentStatus;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, showDot = true, size = 'sm' }: StatusBadgeProps) {
  return (
    <StatusPill status={statusVariant(status)} size={size}>
      {showDot && (
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: calendarStatusColor(status) }}
          aria-hidden
        />
      )}
      {calendarStatusLabel(status)}
    </StatusPill>
  );
}

export default StatusBadge;
