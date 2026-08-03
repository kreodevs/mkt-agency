import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_OUTBOX_DISPATCH } from '../../../shared/queue/queue.constants';
import { OutboxDispatcherService } from '../outbox-dispatcher.service';

export interface OutboxDispatchJobData {
  triggeredAt: string;
}

@Injectable()
export class OutboxDispatcherWorkerService implements OnModuleInit {
  private readonly logger = new Logger(OutboxDispatcherWorkerService.name);

  constructor(
    private readonly dispatcher: OutboxDispatcherService,
    @InjectQueue(QUEUE_OUTBOX_DISPATCH)
    private readonly queue: Queue<OutboxDispatchJobData>,
  ) {}

  onModuleInit(): void {
    void this.queue
      .add(
        'dispatch',
        { triggeredAt: new Date().toISOString() },
        {
          repeat: { every: 30_000 },
          jobId: 'outbox-dispatch',
        },
      )
      .catch((error) => {
        this.logger.warn('Could not schedule outbox dispatch job', error);
      });
  }

  async runDispatch(): Promise<number> {
    return this.dispatcher.dispatchPending();
  }
}
