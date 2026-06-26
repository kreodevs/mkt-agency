import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_AUDIT_RETENTION } from '../../../shared/queue/queue.constants';
import {
  AuditRetentionJobData,
  LogRetentionWorkerService,
} from './log-retention.worker';

@Processor(QUEUE_AUDIT_RETENTION)
export class LogRetentionProcessor extends WorkerHost {
  constructor(private readonly retentionWorker: LogRetentionWorkerService) {
    super();
  }

  async process(_job: Job<AuditRetentionJobData>): Promise<void> {
    await this.retentionWorker.purgeExpiredLogs();
  }
}
