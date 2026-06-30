import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { ContentStatus } from '../content/domain/content.constants';
import { ContentVersionEntity } from '../content/infrastructure/typeorm/content-version.entity';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import {
  CalendarDayDetailResponseDto,
  CalendarDayItemDto,
  CalendarDaySummaryDto,
  CalendarMonthResponseDto,
} from './dto/calendar.response.dto';

interface ContentCalendarRow {
  id: string;
  title: string;
  type: string;
  status: ContentStatus;
  campaignId: string | null;
  campaignName: string | null;
  productId: string | null;
  productName: string | null;
  currentVersionId: string | null;
  scheduledDate: string | null;
  createdAt: Date;
  versionNumber: number | null;
  versionId: string | null;
  body: string | null;
  signatureHash: string | null;
}

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(ContentEntity)
    private readonly contents: Repository<ContentEntity>,
  ) {}

  async getMonth(
    tenantId: string,
    month: number,
    year: number,
    productId?: string,
  ): Promise<CalendarMonthResponseDto> {
    const rows = await this.fetchCalendarRows(tenantId, month, year, productId);
    const byDate = new Map<string, ContentCalendarRow[]>();

    for (const row of rows) {
      const dateKey = this.effectiveDate(row);
      const list = byDate.get(dateKey) ?? [];
      list.push(row);
      byDate.set(dateKey, list);
    }

    const days: CalendarDaySummaryDto[] = [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => {
        const byStatus: Record<string, number> = {};
        for (const item of items) {
          byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
        }

        return {
          date,
          total: items.length,
          byStatus,
          dominantStatus: this.dominantStatus(byStatus),
        };
      });

    return { month, year, days };
  }

  async getDayDetail(
    tenantId: string,
    date: string,
    productId?: string,
  ): Promise<CalendarDayDetailResponseDto> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new NotFoundException({
        error: 'Invalid date format. Use YYYY-MM-DD',
        code: 'VALIDATION_ERROR',
      });
    }

    const [year, month] = date.split('-').map(Number);
    const rows = await this.fetchCalendarRows(tenantId, month, year, productId);
    const items = rows
      .filter((row) => this.effectiveDate(row) === date)
      .map((row) => this.toDayItem(row));

    return { date, items };
  }

  private async fetchCalendarRows(
    tenantId: string,
    month: number,
    year: number,
    productId?: string,
  ): Promise<ContentCalendarRow[]> {
    const qb = this.contents
      .createQueryBuilder('c')
      .leftJoin(CampaignEntity, 'camp', 'camp.id = c.campaign_id')
      .leftJoin(ProductEntity, 'prod', 'prod.id = c.product_id')
      .leftJoin(ContentVersionEntity, 'v', 'v.id = c.current_version_id')
      .select([
        'c.id AS id',
        'c.title AS title',
        'c.type AS type',
        'c.status AS status',
        'c.campaign_id AS "campaignId"',
        'camp.name AS "campaignName"',
        'c.product_id AS "productId"',
        'prod.name AS "productName"',
        'c.current_version_id AS "currentVersionId"',
        'c.scheduled_date AS "scheduledDate"',
        'c.created_at AS "createdAt"',
        'v.version_number AS "versionNumber"',
        'v.id AS "versionId"',
        'v.body AS body',
        'v.signature_hash AS "signatureHash"',
      ])
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere(
        `EXTRACT(MONTH FROM COALESCE(c.scheduled_date, c.created_at)) = :month
         AND EXTRACT(YEAR FROM COALESCE(c.scheduled_date, c.created_at)) = :year`,
        { month, year },
      );

    if (productId) {
      qb.andWhere('c.product_id = :productId', { productId });
    }

    return qb.getRawMany<ContentCalendarRow>();
  }

  private effectiveDate(row: ContentCalendarRow): string {
    if (row.scheduledDate) {
      return String(row.scheduledDate).slice(0, 10);
    }
    const created = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
    return created.toISOString().slice(0, 10);
  }

  private dominantStatus(byStatus: Record<string, number>): ContentStatus | 'mixed' {
    const entries = Object.entries(byStatus);
    if (entries.length === 0) return 'draft';
    if (entries.length === 1) return entries[0][0] as ContentStatus;

    entries.sort((a, b) => b[1] - a[1]);
    if (entries[0][1] === entries[1][1]) return 'mixed';

    return entries[0][0] as ContentStatus;
  }

  private toDayItem(row: ContentCalendarRow): CalendarDayItemDto {
    const body = row.body ?? '';
    return {
      contentId: row.id,
      title: row.title,
      type: row.type,
      status: row.status,
      campaignId: row.campaignId,
      campaignName: row.campaignName,
      productId: row.productId,
      productName: row.productName,
      versionId: row.versionId,
      versionNumber: row.versionNumber,
      signatureHash: row.signatureHash,
      scheduledDate: this.effectiveDate(row),
      preview: body.length > 220 ? `${body.slice(0, 220)}…` : body,
    };
  }
}
