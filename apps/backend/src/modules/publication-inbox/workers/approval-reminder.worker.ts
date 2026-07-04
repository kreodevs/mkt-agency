import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_APPROVAL_REMINDER } from '../../../shared/queue/queue.constants';
import { TenantEntity } from '../../tenant/infrastructure/typeorm/tenant.entity';
import { AGENCY_NOTIFICATION_TYPES } from '../domain/publication-inbox.constants';
import { PublicationInboxService } from '../publication-inbox.service';

export interface ApprovalReminderJobData {
  triggeredAt: string;
  kind?: 'approval' | 'publish';
}

@Injectable()
export class ApprovalReminderWorkerService implements OnModuleInit {
  private readonly logger = new Logger(ApprovalReminderWorkerService.name);

  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectQueue(QUEUE_APPROVAL_REMINDER)
    private readonly queue: Queue<ApprovalReminderJobData>,
    private readonly inboxService: PublicationInboxService,
  ) {}

  onModuleInit(): void {
    void this.queue
      .add(
        'remind-approval',
        { triggeredAt: new Date().toISOString(), kind: 'approval' },
        {
          repeat: { pattern: '0 9 * * *' },
          jobId: 'approval-reminder-daily',
        },
      )
      .catch((error) => {
        this.logger.warn('Could not schedule approval reminder job', error);
      });

    void this.queue
      .add(
        'remind-publish',
        { triggeredAt: new Date().toISOString(), kind: 'publish' },
        {
          repeat: { pattern: '0 23 * * *' },
          jobId: 'publish-reminder-daily',
        },
      )
      .catch((error) => {
        this.logger.warn('Could not schedule publish reminder job', error);
      });
  }

  async sendReminders(): Promise<number> {
    const activeTenants = await this.tenants.find({
      where: { status: 'active' },
    });

    let sent = 0;
    const today = new Date().toISOString().slice(0, 10);

    for (const tenant of activeTenants) {
      try {
        const pending = await this.inboxService.findPendingApprovalForReminder(tenant.id);
        if (pending.length === 0) continue;

        const notification = await this.inboxService.createNotification({
          tenantId: tenant.id,
          type: AGENCY_NOTIFICATION_TYPES.APPROVAL_REMINDER,
          title: 'Tienes publicaciones pendientes',
          body: `${pending.length} pieza(s) programada(s) en las próximas 48 h esperan tu aprobación.`,
          metadata: {
            contentIds: pending.map((row) => row.id),
            pendingCount: pending.length,
          },
          dedupKey: `approval-reminder-${today}`,
        });

        if (notification) sent += 1;
      } catch (error) {
        this.logger.warn(`Approval reminder failed for tenant ${tenant.id}`, error);
      }
    }

    if (sent > 0) {
      this.logger.log(`Sent ${sent} approval reminder notification(s)`);
    }

    return sent;
  }

  async sendPublishReminders(): Promise<number> {
    const activeTenants = await this.tenants.find({
      where: { status: 'active' },
    });

    let sent = 0;
    const today = new Date().toISOString().slice(0, 10);

    for (const tenant of activeTenants) {
      try {
        const readyToday = await this.inboxService.findReadyToPublishToday(tenant.id);
        if (readyToday.length === 0) continue;

        const notification = await this.inboxService.createNotification({
          tenantId: tenant.id,
          type: AGENCY_NOTIFICATION_TYPES.PUBLISH_REMINDER,
          title: 'Hoy toca publicar',
          body: `Tienes ${readyToday.length} publicación(es) lista(s) para copiar y pegar en tus redes hoy.`,
          metadata: {
            contentIds: readyToday.map((row) => row.id),
            readyCount: readyToday.length,
          },
          dedupKey: `publish-reminder-${today}`,
        });

        if (notification) sent += 1;
      } catch (error) {
        this.logger.warn(`Publish reminder failed for tenant ${tenant.id}`, error);
      }
    }

    if (sent > 0) {
      this.logger.log(`Sent ${sent} publish reminder notification(s)`);
    }

    return sent;
  }
}
