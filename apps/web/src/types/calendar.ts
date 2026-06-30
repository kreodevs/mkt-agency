import type { ContentStatus } from './content';

export type CalendarDominantStatus = ContentStatus | 'mixed';

export interface CalendarDaySummary {
  date: string;
  total: number;
  byStatus: Record<string, number>;
  dominantStatus: CalendarDominantStatus;
}

export interface CalendarMonthResponse {
  month: number;
  year: number;
  days: CalendarDaySummary[];
}

export interface CalendarDayItem {
  contentId: string;
  title: string;
  type: string;
  status: ContentStatus;
  campaignId: string | null;
  campaignName: string | null;
  productId: string | null;
  productName: string | null;
  versionId: string | null;
  versionNumber: number | null;
  signatureHash: string | null;
  scheduledDate: string;
  preview: string;
}

export interface CalendarDayDetailResponse {
  date: string;
  items: CalendarDayItem[];
}
