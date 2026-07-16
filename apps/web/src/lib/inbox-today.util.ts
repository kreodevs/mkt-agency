import type { PublicationInboxItem } from '@/types/publication-inbox';

export function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isInboxItemToday(item: PublicationInboxItem): boolean {
  return item.scheduledDate.slice(0, 10) === todayKey();
}

export function getTodayContentIds(
  pending: PublicationInboxItem[],
  ready: PublicationInboxItem[],
): Set<string> {
  const ids = new Set<string>();
  for (const item of [...ready, ...pending]) {
    if (isInboxItemToday(item)) {
      ids.add(item.contentId);
    }
  }
  return ids;
}

export function excludeTodayFromPending(
  pending: PublicationInboxItem[],
  todayIds: Set<string>,
): PublicationInboxItem[] {
  return pending.filter((item) => !todayIds.has(item.contentId));
}
