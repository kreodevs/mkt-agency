import type { CalendarDominantStatus } from '@/types/calendar';
import type { ContentStatus } from '@/types/content';

export function calendarStatusColor(status: CalendarDominantStatus | ContentStatus): string {
  if (status === 'approved') return '#16a34a';
  if (status === 'rejected' || status === 'in_changes') return '#dc2626';
  if (status === 'mixed') return '#64748b';
  return '#ca8a04';
}

export function calendarStatusLabel(status: CalendarDominantStatus | ContentStatus): string {
  if (status === 'mixed') return 'Mixto';
  return status.replace('_', ' ');
}
