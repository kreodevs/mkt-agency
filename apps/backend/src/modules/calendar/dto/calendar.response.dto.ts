import { ContentStatus } from '../../content/domain/content.constants';

export class CalendarDaySummaryDto {
  date!: string;
  total!: number;
  byStatus!: Record<string, number>;
  dominantStatus!: ContentStatus | 'mixed';
}

export class CalendarMonthResponseDto {
  month!: number;
  year!: number;
  days!: CalendarDaySummaryDto[];
}

export class CalendarDayItemDto {
  contentId!: string;
  title!: string;
  type!: string;
  status!: ContentStatus;
  campaignId!: string | null;
  campaignName!: string | null;
  productId!: string | null;
  productName!: string | null;
  versionId!: string | null;
  versionNumber!: number | null;
  signatureHash!: string | null;
  scheduledDate!: string;
  preview!: string;
}

export class CalendarDayDetailResponseDto {
  date!: string;
  items!: CalendarDayItemDto[];
}
