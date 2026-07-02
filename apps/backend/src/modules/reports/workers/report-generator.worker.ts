import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { CampaignEntity } from '../../campaign/infrastructure/typeorm/campaign.entity';
import { runWithLlmUsageContext } from '../../../shared/ai/llm-usage.context';
import { QUEUE_REPORT_GENERATION } from '../../../shared/queue/queue.constants';
import {
  REPORT_ADAPTER,
  ReportAdapterPort,
} from '../adapters/report.adapter.port';
import { ReportEntity } from '../infrastructure/typeorm/report.entity';
import { ReportMetricsService } from '../services/report-metrics.service';

export interface ReportJobData {
  reportId: string;
}

@Injectable()
export class ReportGeneratorWorkerService {
  private readonly logger = new Logger(ReportGeneratorWorkerService.name);

  constructor(
    @InjectRepository(ReportEntity)
    private readonly reports: Repository<ReportEntity>,
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
    @Inject(REPORT_ADAPTER)
    private readonly reportAdapter: ReportAdapterPort,
    private readonly metricsService: ReportMetricsService,
    @InjectQueue(QUEUE_REPORT_GENERATION)
    private readonly queue: Queue<ReportJobData>,
  ) {}

  enqueue(reportId: string): void {
    void this.queue
      .add(
        'generate',
        { reportId },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: 50,
        },
      )
      .catch((error) => {
        this.logger.error(`Failed to enqueue report ${reportId}`, error);
      });
  }

  async processReport(reportId: string): Promise<void> {
    const report = await this.reports.findOne({ where: { id: reportId } });
    if (!report || report.status !== 'generating') {
      return;
    }

    return runWithLlmUsageContext({ tenantId: report.tenantId }, async () => {
      try {
      const campaignId =
        typeof report.config.campaignId === 'string'
          ? report.config.campaignId
          : undefined;

      const metrics = await this.metricsService.collect(report.tenantId, campaignId);

      const campaign = campaignId
        ? await this.campaigns.findOne({
            where: { id: campaignId, tenantId: report.tenantId },
          })
        : null;

      const data = await this.reportAdapter.generate({
        tenantId: report.tenantId,
        type: report.type,
        config: report.config,
        metrics,
        campaign: campaign
          ? {
              id: campaign.id,
              name: campaign.name,
              objective: campaign.objective,
              status: campaign.status,
              platforms: campaign.platforms,
            }
          : null,
      });

      report.data = {
        ...data,
        snapshot: metrics,
      } as unknown as Record<string, unknown>;
      report.status = 'completed';
      await this.reports.save(report);
    } catch (error) {
      report.status = 'failed';
      report.data = {
        error: error instanceof Error ? error.message : 'Report generation failed',
      };
      await this.reports.save(report);

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Report generation failed for ${reportId}: ${message}`);
      throw error;
    }
    });
  }
}
