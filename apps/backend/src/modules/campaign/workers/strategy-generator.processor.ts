import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_CAMPAIGN_STRATEGY } from '../../../shared/queue/queue.constants';
import {
  StrategyGeneratorWorkerService,
  StrategyJobData,
} from './strategy-generator.worker';

@Processor(QUEUE_CAMPAIGN_STRATEGY)
export class StrategyGeneratorProcessor extends WorkerHost {
  constructor(private readonly strategyWorker: StrategyGeneratorWorkerService) {
    super();
  }

  async process(job: Job<StrategyJobData>): Promise<void> {
    await this.strategyWorker.processAssignment(job.data.assignmentId);
  }
}
