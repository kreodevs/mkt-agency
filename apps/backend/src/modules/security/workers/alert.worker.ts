import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { OutboxEntity } from '../../company-profile/infrastructure/typeorm/outbox.entity';
import { QUEUE_SECURITY_ALERT } from '../../../shared/queue/queue.constants';
import {
  SECURITY_ALERT_NOTIFIER,
  SecurityAlertNotifierPort,
  SecurityAlertPayload,
} from '../adapters/security-alert-notifier.port';
import { SECURITY_ALERT_OUTBOX_EVENT } from '../domain/security-alert.constants';

export interface SecurityAlertJobData {
  triggeredAt: string;
}

@Injectable()
export class AlertWorkerService implements OnModuleInit {
  private readonly logger = new Logger(AlertWorkerService.name);

  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outbox: Repository<OutboxEntity>,
    @Inject(SECURITY_ALERT_NOTIFIER)
    private readonly notifier: SecurityAlertNotifierPort,
    @InjectQueue(QUEUE_SECURITY_ALERT)
    private readonly queue: Queue<SecurityAlertJobData>,
  ) {}

  onModuleInit(): void {
    void this.queue
      .add(
        'dispatch',
        { triggeredAt: new Date().toISOString() },
        {
          repeat: { every: 30_000 },
          jobId: 'security-alert-dispatch',
        },
      )
      .catch((error) => {
        this.logger.warn('Could not schedule security alert dispatch job', error);
      });
  }

  async dispatchPendingAlerts(): Promise<number> {
    const pending = await this.outbox.find({
      where: { eventType: SECURITY_ALERT_OUTBOX_EVENT, status: 'pending' },
      order: { createdAt: 'ASC' },
      take: 50,
    });

    let processed = 0;

    for (const entry of pending) {
      try {
        await this.notifier.notify(entry.payload as unknown as SecurityAlertPayload);
        entry.status = 'processed';
        entry.processedAt = new Date();
        await this.outbox.save(entry);
        processed += 1;
      } catch (error) {
        this.logger.error(
          `Failed to dispatch security alert outbox=${entry.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    if (processed > 0) {
      this.logger.log(`Dispatched ${processed} security alert(s) from outbox`);
    }

    return processed;
  }
}
