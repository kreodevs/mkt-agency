import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_WEEKLY_BALANCE } from '../../../shared/queue/queue.constants';
import { WeeklyBalanceService } from '../services/weekly-balance.service';

export interface WeeklyBalanceJobData {
  triggeredAt: string;
}

@Injectable()
export class WeeklyBalanceWorkerService implements OnModuleInit {
  private readonly logger = new Logger(WeeklyBalanceWorkerService.name);

  constructor(
    @InjectQueue(QUEUE_WEEKLY_BALANCE)
    private readonly queue: Queue<WeeklyBalanceJobData>,
    private readonly weeklyBalance: WeeklyBalanceService,
  ) {}

  onModuleInit(): void {
    void this.queue
      .add(
        'weekly-balance',
        { triggeredAt: new Date().toISOString() },
        {
          repeat: { pattern: '0 7 * * 1' },
          jobId: 'agency-weekly-balance',
        },
      )
      .catch((error) => {
        this.logger.warn('Could not schedule weekly balance job', error);
      });
  }

  async run(): Promise<number> {
    const count = await this.weeklyBalance.runForAllTenants();
    if (count > 0) {
      this.logger.log(`Weekly balance completed for ${count} tenant(s)`);
    }
    return count;
  }
}
