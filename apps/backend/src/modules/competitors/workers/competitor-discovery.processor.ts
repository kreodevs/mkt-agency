import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_COMPETITOR_DISCOVERY } from '../../../shared/queue/queue.constants';
import { formatWorkerErrorMessage } from '../../../shared/worker-error.util';
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
    try {
      return await this.discoveryWorker.processDiscover(job.data);
    } catch (error) {
      throw new Error(
        formatWorkerErrorMessage(error, 'No se pudo buscar competidores con IA'),
      );
    }
  }
}
