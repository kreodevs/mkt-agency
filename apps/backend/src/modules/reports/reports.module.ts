import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmModule } from '../../shared/ai/llm.module';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { QueueModule } from '../../shared/queue/queue.module';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { LeadEntity } from '../crm/infrastructure/typeorm/lead.entity';
import { OpenRouterReportAdapter } from './adapters/openrouter-report.adapter';
import { REPORT_ADAPTER, ReportAdapterPort } from './adapters/report.adapter.port';
import { StubReportAdapter } from './adapters/stub-report.adapter';
import { ReportEntity } from './infrastructure/typeorm/report.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportMetricsService } from './services/report-metrics.service';
import { ReportGeneratorProcessor } from './workers/report-generator.processor';
import { ReportGeneratorWorkerService } from './workers/report-generator.worker';

@Module({
  imports: [
    AuthSharedModule,
    QueueModule,
    LlmModule,
    TypeOrmModule.forFeature([
      ReportEntity,
      CampaignEntity,
      LeadEntity,
      ContentEntity,
    ]),
  ],
  controllers: [ReportController],
  providers: [
    ReportService,
    ReportMetricsService,
    ReportGeneratorWorkerService,
    ReportGeneratorProcessor,
    StubReportAdapter,
    OpenRouterReportAdapter,
    {
      provide: REPORT_ADAPTER,
      useFactory: (
        stub: StubReportAdapter,
        llm: OpenRouterReportAdapter,
        providers: LlmProviderService,
      ): ReportAdapterPort => ({
        generate: async (context) => {
          if (await providers.hasActiveConfigured()) {
            return llm.generate(context);
          }
          return stub.generate(context);
        },
      }),
      inject: [StubReportAdapter, OpenRouterReportAdapter, LlmProviderService],
    },
  ],
  exports: [ReportService],
})
export class ReportsModule {}
