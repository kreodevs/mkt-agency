import type { PublicationInboxItem } from '@/types/publication-inbox';

function inboxCreatedAtMs(item: PublicationInboxItem): number {
  if (!item.createdAt) {
    return 0;
  }
  const parsed = Date.parse(item.createdAt);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Más recientes primero; si empatan, fecha programada más lejana (suele ser la generada después). */
export function compareInboxItemsNewestFirst(
  a: PublicationInboxItem,
  b: PublicationInboxItem,
): number {
  const createdDiff = inboxCreatedAtMs(b) - inboxCreatedAtMs(a);
  if (createdDiff !== 0) {
    return createdDiff;
  }

  return b.scheduledDate.localeCompare(a.scheduledDate);
}

export function sortInboxItemsNewestFirst(items: PublicationInboxItem[]): PublicationInboxItem[] {
  return [...items].sort(compareInboxItemsNewestFirst);
}
