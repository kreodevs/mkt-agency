import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_IMAGE_GENERATION } from '../../../shared/queue/queue.constants';
import { ImageGenerationService } from '../image-generation.service';

export interface ImageGenerationJobData {
  generationId: string;
  tenantId: string;
  userId: string;
  size?: string;
  style?: string;
}

@Injectable()
export class ImageGenerationWorkerService {
  private readonly logger = new Logger(ImageGenerationWorkerService.name);

  constructor(
    @InjectQueue(QUEUE_IMAGE_GENERATION)
    private readonly queue: Queue<ImageGenerationJobData>,
    @Inject(forwardRef(() => ImageGenerationService))
    private readonly imageGeneration: ImageGenerationService,
  ) {}

  enqueue(data: ImageGenerationJobData): void {
    void this.queue
      .add('generate-image', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 100,
      })
      .catch((error) => {
        this.logger.error(`Failed to enqueue image generation ${data.generationId}`, error);
      });
  }

  async processGeneration(data: ImageGenerationJobData): Promise<void> {
    await this.imageGeneration.processQueuedGeneration(data);
  }
}
