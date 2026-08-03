import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_OUTBOX_DISPATCH } from '../../../shared/queue/queue.constants';
import {
  OutboxDispatcherWorkerService,
  OutboxDispatchJobData,
} from './outbox-dispatcher.worker';

@Processor(QUEUE_OUTBOX_DISPATCH)
export class OutboxDispatcherProcessor extends WorkerHost {
  constructor(private readonly outboxDispatcherWorker: OutboxDispatcherWorkerService) {
    super();
  }

  async process(_job: Job<OutboxDispatchJobData>): Promise<void> {
    await this.outboxDispatcherWorker.runDispatch();
  }
}
