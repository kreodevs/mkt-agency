import type { ClassValue } from 'clsx';
import { cn } from '@/lib/utils';

/** Base layout + hover microinteractions for list/article cards across the app. */
const LIST_CARD_INTERACTIVE =
  'transition-[transform,box-shadow,border-color] duration-[var(--transition-base)] hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0';

export const LIST_CARD_CLASS = cn(
  'rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-[var(--spacing-md)]',
  LIST_CARD_INTERACTIVE,
);

/** Merge shared list-card styles with optional state overrides (selected, disabled, etc.). */
export function listCardClassName(...extra: ClassValue[]) {
  return cn(LIST_CARD_CLASS, ...extra);
}
