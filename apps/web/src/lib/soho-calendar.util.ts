import type { CalendarDaySummary, CalendarDominantStatus, CalendarMonthResponse } from '@/types/calendar';
import type { PublicationInboxData, PublicationInboxItem } from '@/types/publication-inbox';
import type { ContentStatus } from '@/types/content';

function collectInboxItems(data: PublicationInboxData): PublicationInboxItem[] {
  return [
    ...data.readyToPublish,
    ...data.pendingApproval,
    ...data.upcoming,
    ...data.rejected,
  ];
}

function isInMonth(dateStr: string, month: number, year: number): boolean {
  const [y, m] = dateStr.slice(0, 10).split('-').map(Number);
  return y === year && m === month;
}

/** Estado visual SOHO: verde solo con firma, amarillo si falta aprobar. */
export function sohoCalendarStatus(item: PublicationInboxItem): ContentStatus {
  if (item.status === 'rejected') return 'rejected';
  if (item.status === 'in_changes') return 'in_changes';
  if (item.status === 'approved' && item.signatureHash) return 'approved';
  if (item.status === 'approved') return 'in_review';
  if (item.status === 'in_review' || item.status === 'draft') return item.status as ContentStatus;
  return 'draft';
}

function dominantFromCounts(byStatus: Record<string, number>): CalendarDominantStatus {
  const entries = Object.entries(byStatus);
  if (entries.length === 0) return 'draft';
  if (entries.length === 1) return entries[0][0] as CalendarDominantStatus;

  entries.sort((a, b) => b[1] - a[1]);
  if (entries[0][1] === entries[1][1]) return 'mixed';
  return entries[0][0] as CalendarDominantStatus;
}

export function buildSohoMonthFromInbox(
  inbox: PublicationInboxData,
  month: number,
  year: number,
): CalendarDaySummary[] {
  const byDate = new Map<string, PublicationInboxItem[]>();

  for (const item of collectInboxItems(inbox)) {
    const date = item.scheduledDate.slice(0, 10);
    if (!isInMonth(date, month, year)) continue;
    const list = byDate.get(date) ?? [];
    list.push(item);
    byDate.set(date, list);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => {
      const byStatus: Record<string, number> = {};
      for (const item of items) {
        const key = sohoCalendarStatus(item);
        byStatus[key] = (byStatus[key] ?? 0) + 1;
      }
      return {
        date,
        total: items.length,
        byStatus,
        dominantStatus: dominantFromCounts(byStatus),
      };
    });
}

function mergeDaySummaries(
  primary: CalendarDaySummary,
  secondary: CalendarDaySummary,
): CalendarDaySummary {
  const byStatus = { ...primary.byStatus };
  for (const [status, count] of Object.entries(secondary.byStatus)) {
    byStatus[status] = (byStatus[status] ?? 0) + count;
  }

  const total = Math.max(primary.total, secondary.total);

  return {
    date: primary.date,
    total,
    byStatus,
    dominantStatus: dominantFromCounts(byStatus),
  };
}

/** Combina resumen API con bandeja SOHO (fuente de verdad para colores y días cercanos). */
export function mergeSohoCalendarMonth(
  apiMonth: CalendarMonthResponse | undefined,
  inbox: PublicationInboxData | undefined,
  month: number,
  year: number,
): CalendarMonthResponse {
  const merged = new Map<string, CalendarDaySummary>();

  for (const day of apiMonth?.days ?? []) {
    merged.set(day.date, day);
  }

  const inboxDays = inbox ? buildSohoMonthFromInbox(inbox, month, year) : [];
  for (const day of inboxDays) {
    const existing = merged.get(day.date);
    merged.set(day.date, existing ? mergeDaySummaries(day, existing) : day);
  }

  const days = [...merged.values()].sort((a, b) => a.date.localeCompare(b.date));

  return { month, year, days };
}
