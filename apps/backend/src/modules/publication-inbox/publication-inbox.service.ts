import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { ContentStatus } from '../content/domain/content.constants';
import { ContentService } from '../content/content.service';
import { ContentVersionEntity } from '../content/infrastructure/typeorm/content-version.entity';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import {
  AGENCY_NOTIFICATION_TYPES,
  APPROVAL_REMINDER_HOURS,
  INBOX_LOOKAHEAD_DAYS,
  INBOX_LOOKBACK_DAYS,
} from './domain/publication-inbox.constants';
import {
  AgencyNotificationDto,
  BulkApproveResponseDto,
  PublicationInboxItemDto,
  PublicationInboxResponseDto,
} from './dto/publication-inbox.dto';
import { sanitizePublishableCopy } from '../../shared/domain/sanitize-publishable-copy.util';
import { AgencyNotificationEntity } from './infrastructure/typeorm/agency-notification.entity';

interface InboxRow {
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
  platform: string | null;
  visualFormat: string | null;
  assets: unknown;
}

@Injectable()
export class PublicationInboxService {
  constructor(
    @InjectRepository(ContentEntity)
    private readonly contents: Repository<ContentEntity>,
    @InjectRepository(AgencyNotificationEntity)
    private readonly notifications: Repository<AgencyNotificationEntity>,
    private readonly contentService: ContentService,
  ) {}

  async getInbox(tenantId: string, productId?: string): Promise<PublicationInboxResponseDto> {
    const today = this.todayKey();
    const rows = await this.fetchInboxRows(tenantId, productId);

    const pendingApproval: PublicationInboxItemDto[] = [];
    const readyToPublish: PublicationInboxItemDto[] = [];
    const upcoming: PublicationInboxItemDto[] = [];
    const rejected: PublicationInboxItemDto[] = [];

    for (const row of rows) {
      const item = this.toInboxItem(row);
      const isApproved = row.status === 'approved' && Boolean(row.signatureHash);
      const isRejected = row.status === 'rejected';
      const isPending =
        !isApproved &&
        !isRejected &&
        ['draft', 'in_review', 'in_changes'].includes(row.status);

      if (isRejected) {
        rejected.push(item);
      } else if (isPending) {
        pendingApproval.push(item);
      } else if (isApproved && item.scheduledDate <= today) {
        readyToPublish.push(item);
      } else if (item.scheduledDate > today) {
        upcoming.push(item);
      }
    }

    const sortByDate = (a: PublicationInboxItemDto, b: PublicationInboxItemDto) =>
      a.scheduledDate.localeCompare(b.scheduledDate);

    pendingApproval.sort(sortByDate);
    readyToPublish.sort(sortByDate);
    upcoming.sort(sortByDate);
    rejected.sort(sortByDate);

    const notificationRows = await this.notifications.find({
      where: { tenantId, readAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const notifications = notificationRows.map((n) => this.toNotificationDto(n));

    return {
      pendingApproval,
      readyToPublish,
      upcoming,
      rejected,
      notifications,
      stats: {
        pendingCount: pendingApproval.length,
        readyCount: readyToPublish.length,
        upcomingCount: upcoming.length,
        rejectedCount: rejected.length,
        unreadNotifications: notifications.length,
      },
    };
  }

  async dismissRejected(
    tenantId: string,
    contentId: string,
  ): Promise<{ contentId: string; dismissed: true }> {
    const content = await this.contents.findOne({ where: { id: contentId, tenantId } });
    if (!content) {
      throw new NotFoundException({ error: 'Contenido no encontrado', code: 'NOT_FOUND' });
    }
    if (content.status !== 'rejected') {
      throw new BadRequestException({
        error: 'Solo se pueden archivar piezas rechazadas',
        code: 'INVALID_STATUS',
      });
    }

    await this.contentService.remove(tenantId, contentId);
    return { contentId, dismissed: true };
  }

  async bulkApprove(
    tenantId: string,
    userId: string,
    contentIds: string[],
  ): Promise<BulkApproveResponseDto> {
    const result: BulkApproveResponseDto = { approved: 0, failed: [] };

    for (const contentId of contentIds) {
      try {
        const content = await this.contents.findOne({ where: { id: contentId, tenantId } });
        if (!content?.currentVersionId) {
          result.failed.push({ contentId, reason: 'Contenido no encontrado' });
          continue;
        }

        await this.contentService.approveVersion(
          tenantId,
          userId,
          contentId,
          content.currentVersionId,
          {},
        );
        result.approved += 1;
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : 'No se pudo aprobar';
        result.failed.push({ contentId, reason });
      }
    }

    return result;
  }

  async markNotificationRead(tenantId: string, notificationId: string): Promise<void> {
    const notification = await this.notifications.findOne({
      where: { id: notificationId, tenantId },
    });

    if (!notification) {
      throw new NotFoundException({
        error: 'Notificación no encontrada',
        code: 'NOT_FOUND',
      });
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notifications.save(notification);
    }
  }

  async markAllNotificationsRead(tenantId: string): Promise<number> {
    const result = await this.notifications.update(
      { tenantId, readAt: IsNull() },
      { readAt: new Date() },
    );
    return result.affected ?? 0;
  }

  async createNotification(params: {
    tenantId: string;
    productId?: string | null;
    type: string;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
    dedupKey?: string;
  }): Promise<AgencyNotificationEntity | null> {
    if (params.dedupKey) {
      const existing = await this.notifications
        .createQueryBuilder('n')
        .where('n.tenant_id = :tenantId', { tenantId: params.tenantId })
        .andWhere('n.type = :type', { type: params.type })
        .andWhere("n.metadata->>'dedupKey' = :dedupKey", { dedupKey: params.dedupKey })
        .andWhere('n.created_at > NOW() - INTERVAL \'24 hours\'')
        .getOne();

      if (existing) {
        return null;
      }
    }

    return this.notifications.save(
      this.notifications.create({
        tenantId: params.tenantId,
        productId: params.productId ?? null,
        type: params.type,
        title: params.title,
        body: params.body,
        metadata: {
          ...params.metadata,
          ...(params.dedupKey ? { dedupKey: params.dedupKey } : {}),
        },
      }),
    );
  }

  async findPendingApprovalForReminder(tenantId: string): Promise<InboxRow[]> {
    const today = this.todayKey();
    const reminderEnd = this.addDays(today, Math.ceil(APPROVAL_REMINDER_HOURS / 24));

    const rows = await this.fetchInboxRows(tenantId);
    return rows.filter((row) => {
      const effectiveDate = this.effectiveDate(row);
      const isApproved = row.status === 'approved' && Boolean(row.signatureHash);
      const isPending =
        !isApproved &&
        row.status !== 'rejected' &&
        ['draft', 'in_review', 'in_changes'].includes(row.status);
      return isPending && effectiveDate >= today && effectiveDate <= reminderEnd;
    });
  }

  async findReadyToPublishToday(tenantId: string, productId?: string): Promise<InboxRow[]> {
    const today = this.todayKey();
    const rows = await this.fetchInboxRows(tenantId, productId);
    return rows.filter((row) => {
      const isApproved = row.status === 'approved' && Boolean(row.signatureHash);
      return isApproved && this.effectiveDate(row) === today;
    });
  }

  async findDueTodayForReminder(tenantId: string, productId?: string): Promise<InboxRow[]> {
    const today = this.todayKey();
    const rows = await this.fetchInboxRows(tenantId, productId);
    return rows.filter((row) => this.effectiveDate(row) === today);
  }

  private async fetchInboxRows(tenantId: string, productId?: string): Promise<InboxRow[]> {
    const startDate = this.addDays(this.todayKey(), -INBOX_LOOKBACK_DAYS);
    const endDate = this.addDays(this.todayKey(), INBOX_LOOKAHEAD_DAYS);

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
        'v.assets AS assets',
        'c.platform AS platform',
        'c.visual_format AS "visualFormat"',
      ])
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere(
        `DATE(COALESCE(c.scheduled_date, c.created_at)) BETWEEN :startDate AND :endDate`,
        { startDate, endDate },
      );

    if (productId) {
      qb.andWhere('c.product_id = :productId', { productId });
    }

    return qb.getRawMany<InboxRow>();
  }

  private toInboxItem(row: InboxRow): PublicationInboxItemDto {
    const rawBody = row.body ?? '';
    const body = sanitizePublishableCopy(rawBody);
    const assets = this.parseAssets(row.assets);
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
      body,
      platform: row.platform,
      visualFormat: row.visualFormat ?? 'image',
      assets,
    };
  }

  private parseAssets(raw: unknown): unknown[] {
    if (Array.isArray(raw)) {
      return raw;
    }
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private toNotificationDto(row: AgencyNotificationEntity): AgencyNotificationDto {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      productId: row.productId,
      metadata: row.metadata ?? {},
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private effectiveDate(row: InboxRow): string {
    if (row.scheduledDate) {
      return String(row.scheduledDate).slice(0, 10);
    }
    const created = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
    return created.toISOString().slice(0, 10);
  }

  private todayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private addDays(dateKey: string, days: number): string {
    const date = new Date(`${dateKey}T12:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }
}

export { AGENCY_NOTIFICATION_TYPES };
