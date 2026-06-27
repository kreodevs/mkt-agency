import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_COMPETITOR_INTEL } from '../../../shared/queue/queue.constants';
import { CompetitorIntelJobData, CompetitorIntelWorkerService } from './competitor-intel.worker';

@Processor(QUEUE_COMPETITOR_INTEL)
export class CompetitorIntelProcessor extends WorkerHost {
  constructor(private readonly brandWorker: CompetitorIntelWorkerService) {
    super();
  }

  async process(job: Job<CompetitorIntelJobData>): Promise<void> {
    await this.brandWorker.processAnalysis(job.data.analysisId);
  }
}