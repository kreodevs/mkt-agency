import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmModule } from '../../shared/ai/llm.module';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { QUEUE_COMPETITOR_DISCOVERY } from '../../shared/queue/queue.constants';
import { SearchModule } from '../../shared/search/search.module';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { ProductModule } from '../product/product.module';
import { CompanyProfileModule } from '../company-profile/company-profile.module';
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { CompanyProfileSectionEntity } from '../company-profile/infrastructure/typeorm/company-profile-section.entity';
import { AgentInterviewEntity } from '../agents/domain/agent-interview.entity';
import { COMPETITOR_DISCOVERY_ADAPTER } from './adapters/competitor-discovery.adapter.port';
import { OpenRouterCompetitorDiscoveryAdapter } from './adapters/openrouter-competitor-discovery.adapter';
import { StubCompetitorDiscoveryAdapter } from './adapters/stub-competitor-discovery.adapter';
import { CompetitorController } from './competitor.controller';
import { CompetitorService } from './competitor.service';
import { CompetitorDiscoveryProcessor } from './workers/competitor-discovery.processor';
import { CompetitorDiscoveryWorkerService } from './workers/competitor-discovery.worker';
import { CompetitorMentionEntity } from './infrastructure/typeorm/competitor-mention.entity';
import { CompetitorEntity } from './infrastructure/typeorm/competitor.entity';

@Module({
  imports: [
    AuthSharedModule,
    LlmModule,
    SearchModule,
    BullModule.registerQueue({ name: QUEUE_COMPETITOR_DISCOVERY }),
    ProductModule,
    CompanyProfileModule,
    TypeOrmModule.forFeature([
      CompetitorEntity,
      CompetitorMentionEntity,
      CompanyProfileEntity,
      CompanyProfileSectionEntity,
      AgentInterviewEntity,
    ]),
  ],
  controllers: [CompetitorController],
  providers: [
    CompetitorService,
    CompetitorDiscoveryWorkerService,
    CompetitorDiscoveryProcessor,
    StubCompetitorDiscoveryAdapter,
    OpenRouterCompetitorDiscoveryAdapter,
    {
      provide: COMPETITOR_DISCOVERY_ADAPTER,
      useFactory: (
        stub: StubCompetitorDiscoveryAdapter,
        llm: OpenRouterCompetitorDiscoveryAdapter,
        providers: LlmProviderService,
      ) => ({
        discover: async (context: Parameters<StubCompetitorDiscoveryAdapter['discover']>[0]) => {
          if (await providers.hasActiveConfigured()) {
            return llm.discover(context);
          }
          return stub.discover(context);
        },
      }),
      inject: [
        StubCompetitorDiscoveryAdapter,
        OpenRouterCompetitorDiscoveryAdapter,
        LlmProviderService,
      ],
    },
  ],
  exports: [CompetitorService, CompetitorDiscoveryWorkerService],
})
export class CompetitorsModule {}
