import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { LlmModule } from '../../shared/ai/llm.module';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { QUEUE_BRAND_INTERVIEW } from '../../shared/queue/queue.constants';
import { CompanyProfileModule } from '../company-profile/company-profile.module';
import { OpenRouterInterviewAdapter } from './adapters/openrouter-interview.adapter';
import { StubInterviewAdapter } from './adapters/stub-interview.adapter';
import { INTERVIEW_ADAPTER, InterviewAdapterPort } from './adapters/interview.adapter.port';
import { AgentInterviewController } from './agent-interview.controller';
import { AgentInterviewService } from './agent-interview.service';
import { AgentInterviewEntity } from './domain/agent-interview.entity';
import { AgentInterviewMessageEntity } from './domain/agent-interview-message.entity';
import { BrandInterviewWorkerService } from './workers/brand-interview.worker';
import { BrandInterviewProcessor } from './workers/brand-interview.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentInterviewEntity, AgentInterviewMessageEntity]),
    BullModule.registerQueue({ name: QUEUE_BRAND_INTERVIEW }),
    LlmModule,
    CompanyProfileModule,
  ],
  controllers: [AgentInterviewController],
  providers: [
    AgentInterviewService,
    StubInterviewAdapter,
    OpenRouterInterviewAdapter,
    BrandInterviewWorkerService,
    BrandInterviewProcessor,
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
  ],
  exports: [AgentInterviewService],
})
export class AgentsModule {}