import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_REPORT_GENERATION } from '../../../shared/queue/queue.constants';
import {
  ReportGeneratorWorkerService,
  ReportJobData,
} from './report-generator.worker';

@Processor(QUEUE_REPORT_GENERATION)
export class ReportGeneratorProcessor extends WorkerHost {
  constructor(private readonly reportWorker: ReportGeneratorWorkerService) {
    super();
  }

  async process(job: Job<ReportJobData>): Promise<void> {
    await this.reportWorker.processReport(job.data.reportId);
  }
}
