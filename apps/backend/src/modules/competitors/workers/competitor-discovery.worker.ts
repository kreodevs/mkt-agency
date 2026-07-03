import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_COMPETITOR_DISCOVERY } from '../../../shared/queue/queue.constants';
import { DiscoverCompetitorsDto } from '../dto/competitor.request.dto';
import {
  DiscoverCompetitorsJobStatusDto,
  DiscoverCompetitorsResponseDto,
} from '../dto/competitor.response.dto';
import { CompetitorService } from '../competitor.service';

export interface CompetitorDiscoveryJobData {
  tenantId: string;
  dto: DiscoverCompetitorsDto;
}

@Injectable()
export class CompetitorDiscoveryWorkerService {
  private readonly logger = new Logger(CompetitorDiscoveryWorkerService.name);

  constructor(
    @InjectQueue(QUEUE_COMPETITOR_DISCOVERY)
    private readonly queue: Queue<CompetitorDiscoveryJobData>,
    private readonly competitorService: CompetitorService,
  ) {}

  async enqueue(tenantId: string, dto: DiscoverCompetitorsDto): Promise<string> {
    const job = await this.queue.add('discover', { tenantId, dto }, {
      removeOnComplete: { count: 100, age: 3600 },
      removeOnFail: { count: 50, age: 86400 },
    });
    return String(job.id);
  }

  async getStatus(
    jobId: string,
    tenantId: string,
  ): Promise<DiscoverCompetitorsJobStatusDto> {
    const job = await this.queue.getJob(jobId);
    if (!job || job.data.tenantId !== tenantId) {
      throw new NotFoundException({
        error: 'Discovery job not found',
        code: 'NOT_FOUND',
      });
    }

    const state = await job.getState();
    if (state === 'completed') {
      return {
        jobId,
        status: 'completed',
        result: job.returnvalue as DiscoverCompetitorsResponseDto,
      };
    }

    if (state === 'failed') {
      return {
        jobId,
        status: 'failed',
        error: job.failedReason ?? 'Discovery failed',
      };
    }

    return { jobId, status: 'processing' };
  }

  async processDiscover(
    data: CompetitorDiscoveryJobData,
  ): Promise<DiscoverCompetitorsResponseDto> {
    return this.competitorService.discover(data.tenantId, data.dto);
  }
}
