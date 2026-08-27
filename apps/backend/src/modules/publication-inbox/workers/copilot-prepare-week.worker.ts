import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_COPILOT_PREPARE_WEEK } from '../../../shared/queue/queue.constants';
import type {
  PrepareWeekJobStatusDto,
  PrepareWeekResponseDto,
} from '../dto/publication-inbox.dto';
import { CopilotOrchestrationService } from '../copilot-orchestration.service';
import type { CopilotPrepareHorizon } from '../domain/publication-inbox.constants';

export interface CopilotPrepareWeekJobData {
  tenantId: string;
  userId: string;
  productId?: string;
  horizon: CopilotPrepareHorizon;
}

@Injectable()
export class CopilotPrepareWeekWorkerService {
  private readonly logger = new Logger(CopilotPrepareWeekWorkerService.name);

  constructor(
    @InjectQueue(QUEUE_COPILOT_PREPARE_WEEK)
    private readonly queue: Queue<CopilotPrepareWeekJobData>,
    private readonly copilotOrchestration: CopilotOrchestrationService,
  ) {}

  async enqueue(
    tenantId: string,
    userId: string,
    productId?: string,
    horizon: CopilotPrepareHorizon = 'week',
  ): Promise<string> {
    const dedupKey = `prepare-${horizon}:${tenantId}:${productId ?? 'primary'}`;
    const existing = await this.queue.getJob(dedupKey);
    if (existing) {
      const state = await existing.getState();
      if (state === 'active' || state === 'waiting' || state === 'delayed') {
        return dedupKey;
      }
      await existing.remove();
    }

    const job = await this.queue.add(
      'prepare-week',
      { tenantId, userId, productId, horizon },
      {
        jobId: dedupKey,
        removeOnComplete: true,
        removeOnFail: { count: 20, age: 86400 },
      },
    );

    return String(job.id);
  }

  async getStatus(jobId: string, tenantId: string): Promise<PrepareWeekJobStatusDto> {
    const job = await this.queue.getJob(jobId);
    if (!job || job.data.tenantId !== tenantId) {
      throw new NotFoundException({
        error: 'Prepare-week job not found',
        code: 'NOT_FOUND',
      });
    }

    const state = await job.getState();
    if (state === 'completed') {
      return {
        jobId,
        status: 'completed',
        result: job.returnvalue as PrepareWeekResponseDto,
      };
    }

    if (state === 'failed') {
      return {
        jobId,
        status: 'failed',
        error: job.failedReason ?? 'Prepare week failed',
      };
    }

    return { jobId, status: 'processing' };
  }

  async processPrepareWeek(data: CopilotPrepareWeekJobData): Promise<PrepareWeekResponseDto> {
    this.logger.log(
      `Processing prepare-${data.horizon} for tenant ${data.tenantId} product ${data.productId ?? 'primary'}`,
    );
    return this.copilotOrchestration.prepareWeek(
      data.tenantId,
      data.userId,
      data.productId,
      data.horizon,
    );
  }
}
