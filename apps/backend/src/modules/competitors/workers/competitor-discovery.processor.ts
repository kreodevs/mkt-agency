import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_COMPETITOR_DISCOVERY } from '../../../shared/queue/queue.constants';
import {
  CompetitorDiscoveryJobData,
  CompetitorDiscoveryWorkerService,
} from './competitor-discovery.worker';

@Processor(QUEUE_COMPETITOR_DISCOVERY)
export class CompetitorDiscoveryProcessor extends WorkerHost {
  constructor(private readonly discoveryWorker: CompetitorDiscoveryWorkerService) {
    super();
  }

  async process(job: Job<CompetitorDiscoveryJobData>): Promise<unknown> {
    return this.discoveryWorker.processDiscover(job.data);
  }
}
