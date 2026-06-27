import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_BRAND_INTERVIEW } from '../../../shared/queue/queue.constants';
import { BrandInterviewJobData, BrandInterviewWorkerService } from './brand-interview.worker';

@Processor(QUEUE_BRAND_INTERVIEW)
export class BrandInterviewProcessor extends WorkerHost {
  constructor(private readonly brandWorker: BrandInterviewWorkerService) {
    super();
  }

  async process(job: Job<BrandInterviewJobData>): Promise<void> {
    await this.brandWorker.processInterview(job.data.interviewId);
  }
}