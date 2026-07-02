import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_IMAGE_GENERATION } from '../../../shared/queue/queue.constants';
import {
  ImageGenerationJobData,
  ImageGenerationWorkerService,
} from './image-generation.worker';

@Processor(QUEUE_IMAGE_GENERATION)
export class ImageGenerationProcessor extends WorkerHost {
  constructor(private readonly imageGenerationWorker: ImageGenerationWorkerService) {
    super();
  }

  async process(job: Job<ImageGenerationJobData>): Promise<void> {
    await this.imageGenerationWorker.processGeneration(job.data);
  }
}
