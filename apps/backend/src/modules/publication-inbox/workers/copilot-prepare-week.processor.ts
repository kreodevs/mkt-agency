import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_COPILOT_PREPARE_WEEK } from '../../../shared/queue/queue.constants';
import {
  CopilotPrepareWeekJobData,
  CopilotPrepareWeekWorkerService,
} from './copilot-prepare-week.worker';

@Processor(QUEUE_COPILOT_PREPARE_WEEK, {
  lockDuration: 300_000,
  maxStalledCount: 2,
})
export class CopilotPrepareWeekProcessor extends WorkerHost {
  constructor(private readonly prepareWeekWorker: CopilotPrepareWeekWorkerService) {
    super();
  }

  async process(job: Job<CopilotPrepareWeekJobData>): Promise<unknown> {
    return this.prepareWeekWorker.processPrepareWeek(job.data);
  }
}
