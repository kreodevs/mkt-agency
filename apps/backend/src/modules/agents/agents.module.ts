import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { LlmModule } from '../../shared/ai/llm.module';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { QUEUE_BRAND_INTERVIEW, QUEUE_COMPETITOR_INTEL } from '../../shared/queue/queue.constants';
import { CompanyProfileModule } from '../company-profile/company-profile.module';
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { OpenRouterInterviewAdapter } from './adapters/openrouter-interview.adapter';
import { StubInterviewAdapter } from './adapters/stub-interview.adapter';
import { INTERVIEW_ADAPTER, InterviewAdapterPort } from './adapters/interview.adapter.port';
import { OpenRouterCompetitorIntelAdapter } from './adapters/openrouter-competitor-intel.adapter';
import { StubCompetitorIntelAdapter } from './adapters/stub-competitor-intel.adapter';
import { COMPETITOR_INTEL_ADAPTER, CompetitorIntelAdapterPort } from './adapters/competitor-intel.adapter.port';
import { AgentInterviewController } from './agent-interview.controller';
import { AgentInterviewService } from './agent-interview.service';
import { AgentInterviewEntity } from './domain/agent-interview.entity';
import { AgentInterviewMessageEntity } from './domain/agent-interview-message.entity';
import { AgentCompetitorAnalysisEntity } from './domain/agent-competitor-analysis.entity';
import { BrandInterviewWorkerService } from './workers/brand-interview.worker';
import { BrandInterviewProcessor } from './workers/brand-interview.processor';
import { CompetitorIntelWorkerService } from './workers/competitor-intel.worker';
import { CompetitorIntelProcessor } from './workers/competitor-intel.processor';
import { CompetitorIntelService } from './competitor-intel.service';
import { CompetitorIntelController } from './competitor-intel.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgentInterviewEntity,
      AgentInterviewMessageEntity,
      AgentCompetitorAnalysisEntity,
      CompanyProfileEntity,
    ]),
    BullModule.registerQueue(
      { name: QUEUE_BRAND_INTERVIEW },
      { name: QUEUE_COMPETITOR_INTEL },
    ),
    LlmModule,
    CompanyProfileModule,
  ],
  controllers: [AgentInterviewController, CompetitorIntelController],
  providers: [
    AgentInterviewService,
    StubInterviewAdapter,
    OpenRouterInterviewAdapter,
    BrandInterviewWorkerService,
    BrandInterviewProcessor,
    CompetitorIntelService,
    StubCompetitorIntelAdapter,
    OpenRouterCompetitorIntelAdapter,
    CompetitorIntelWorkerService,
    CompetitorIntelProcessor,
    {
      provide: INTERVIEW_ADAPTER,
      useFactory: (
        stub: StubInterviewAdapter,
        llm: OpenRouterInterviewAdapter,
        providers: LlmProviderService,
      ): InterviewAdapterPort => ({
        generateNextQuestion: async (context) => {
          if (await providers.hasActiveConfigured()) {
            return llm.generateNextQuestion(context);
          }
          return stub.generateNextQuestion(context);
        },
        generateBrandBrief: async (context) => {
          if (await providers.hasActiveConfigured()) {
            return llm.generateBrandBrief(context);
          }
          return stub.generateBrandBrief(context);
        },
      }),
      inject: [StubInterviewAdapter, OpenRouterInterviewAdapter, LlmProviderService],
    },
    {
      provide: COMPETITOR_INTEL_ADAPTER,
      useFactory: (
        stub: StubCompetitorIntelAdapter,
        llm: OpenRouterCompetitorIntelAdapter,
        providers: LlmProviderService,
      ): CompetitorIntelAdapterPort => ({
        generateAnalysis: async (competitors, tenantContext) => {
          if (await providers.hasActiveConfigured()) {
            return llm.generateAnalysis(competitors, tenantContext);
          }
          return stub.generateAnalysis(competitors, tenantContext);
        },
      }),
      inject: [StubCompetitorIntelAdapter, OpenRouterCompetitorIntelAdapter, LlmProviderService],
    },
  ],
  exports: [AgentInterviewService, CompetitorIntelService],
})
export class AgentsModule {}