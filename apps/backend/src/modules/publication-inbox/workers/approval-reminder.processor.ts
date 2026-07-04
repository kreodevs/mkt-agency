import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_APPROVAL_REMINDER } from '../../../shared/queue/queue.constants';
import {
  ApprovalReminderJobData,
  ApprovalReminderWorkerService,
} from './approval-reminder.worker';

@Processor(QUEUE_APPROVAL_REMINDER)
export class ApprovalReminderProcessor extends WorkerHost {
  constructor(private readonly reminderWorker: ApprovalReminderWorkerService) {
    super();
  }

  async process(job: Job<ApprovalReminderJobData>): Promise<void> {
    if (job.name === 'remind-publish') {
      await this.reminderWorker.sendPublishReminders();
      return;
    }
    await this.reminderWorker.sendReminders();
  }
}
