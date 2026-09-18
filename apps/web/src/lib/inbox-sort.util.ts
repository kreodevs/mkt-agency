import type { PublicationInboxItem } from '@/types/publication-inbox';

function parseTimestamp(value?: string): number {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Última actividad del contenido (creación o actualización, p. ej. al adjuntar visual). */
function inboxActivityMs(item: PublicationInboxItem): number {
  return Math.max(parseTimestamp(item.createdAt), parseTimestamp(item.updatedAt));
}

/** Más recientes primero; si empatan, fecha programada más lejana. */
export function compareInboxItemsNewestFirst(
  a: PublicationInboxItem,
  b: PublicationInboxItem,
): number {
  const activityDiff = inboxActivityMs(b) - inboxActivityMs(a);
  if (activityDiff !== 0) {
    return activityDiff;
  }

  return b.scheduledDate.localeCompare(a.scheduledDate);
}

export function sortInboxItemsNewestFirst(
  items: PublicationInboxItem[],
  newContentIds?: ReadonlySet<string>,
): PublicationInboxItem[] {
  if (!newContentIds || newContentIds.size === 0) {
    return [...items].sort(compareInboxItemsNewestFirst);
  }

  return [...items].sort((a, b) => {
    const aNew = newContentIds.has(a.contentId) ? 1 : 0;
    const bNew = newContentIds.has(b.contentId) ? 1 : 0;
    if (bNew !== aNew) {
      return bNew - aNew;
    }
    return compareInboxItemsNewestFirst(a, b);
  });
}
