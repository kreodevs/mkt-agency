import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_SECURITY_ALERT } from '../../../shared/queue/queue.constants';
import { AlertWorkerService, SecurityAlertJobData } from './alert.worker';

@Processor(QUEUE_SECURITY_ALERT)
export class AlertProcessor extends WorkerHost {
  constructor(private readonly alertWorker: AlertWorkerService) {
    super();
  }

  async process(_job: Job<SecurityAlertJobData>): Promise<void> {
    await this.alertWorker.dispatchPendingAlerts();
  }
}
