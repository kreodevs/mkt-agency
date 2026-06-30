import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_AGENCY_WEEKLY_RUN } from '../../../shared/queue/queue.constants';
import {
  AgencyWeeklyRunJobData,
  AgencyWeeklyRunWorkerService,
} from './agency-weekly-run.worker';

@Processor(QUEUE_AGENCY_WEEKLY_RUN)
export class AgencyWeeklyRunProcessor extends WorkerHost {
  constructor(private readonly weeklyRunWorker: AgencyWeeklyRunWorkerService) {
    super();
  }

  async process(_job: Job<AgencyWeeklyRunJobData>): Promise<void> {
    await this.weeklyRunWorker.runWeeklyGeneration();
  }
}
