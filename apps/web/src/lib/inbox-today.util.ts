import type { PublicationInboxItem } from '@/types/publication-inbox';

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
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
