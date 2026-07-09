import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_WEEKLY_BALANCE } from '../../../shared/queue/queue.constants';
import {
  WeeklyBalanceJobData,
  WeeklyBalanceWorkerService,
} from './weekly-balance.worker';

@Processor(QUEUE_WEEKLY_BALANCE)
export class WeeklyBalanceProcessor extends WorkerHost {
  constructor(private readonly weeklyBalanceWorker: WeeklyBalanceWorkerService) {
    super();
  }

  async process(_job: Job<WeeklyBalanceJobData>): Promise<void> {
    await this.weeklyBalanceWorker.run();
  }
}
