import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_SECTION_SUGGESTION } from '../../../shared/queue/queue.constants';
import {
  SuggestionJobData,
  SuggestionWorkerService,
} from './suggestion.worker';

@Processor(QUEUE_SECTION_SUGGESTION)
export class SuggestionProcessor extends WorkerHost {
  constructor(private readonly suggestionWorker: SuggestionWorkerService) {
    super();
  }

  async process(job: Job<SuggestionJobData>): Promise<void> {
    await this.suggestionWorker.processAssignment(job.data.assignmentId);
  }
}
