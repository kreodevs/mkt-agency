import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_AUDIT_RETENTION } from '../../../shared/queue/queue.constants';
import { AuditLogEntity } from '../../users/infrastructure/typeorm/audit-log.entity';

export const AUDIT_RETENTION_DAYS = 90;

export interface AuditRetentionJobData {
  triggeredAt: string;
}

@Injectable()
export class LogRetentionWorkerService implements OnModuleInit {
  private readonly logger = new Logger(LogRetentionWorkerService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly logs: Repository<AuditLogEntity>,
    @InjectQueue(QUEUE_AUDIT_RETENTION)
    private readonly queue: Queue<AuditRetentionJobData>,
  ) {}

  onModuleInit(): void {
    void this.queue
      .add(
        'purge',
        { triggeredAt: new Date().toISOString() },
        {
          repeat: { pattern: '0 3 * * *' },
          jobId: 'audit-log-retention-daily',
        },
      )
      .catch((error) => {
        this.logger.warn('Could not schedule audit retention job', error);
      });
  }

  async purgeExpiredLogs(): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - AUDIT_RETENTION_DAYS);

    const result = await this.logs
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoff', { cutoff: cutoff.toISOString() })
      .execute();

    const deleted = result.affected ?? 0;
    if (deleted > 0) {
      this.logger.log(`Purged ${deleted} audit logs older than ${AUDIT_RETENTION_DAYS} days`);
    }

    return deleted;
  }
}
