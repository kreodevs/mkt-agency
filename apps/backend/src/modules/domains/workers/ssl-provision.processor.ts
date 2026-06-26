import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_SSL_PROVISION } from '../../../shared/queue/queue.constants';
import {
  SslProvisionJobData,
  SslProvisionWorkerService,
} from './ssl-provision.worker';

@Processor(QUEUE_SSL_PROVISION)
export class SslProvisionProcessor extends WorkerHost {
  constructor(private readonly sslWorker: SslProvisionWorkerService) {
    super();
  }

  async process(job: Job<SslProvisionJobData>): Promise<void> {
    await this.sslWorker.processDomain(job.data.domainId);
  }
}
