import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmModule } from '../../shared/ai/llm.module';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { QueueModule } from '../../shared/queue/queue.module';
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { OpenRouterStrategyAdapter } from './adapters/openrouter-strategy.adapter';
import {
  STRATEGY_ADAPTER,
  StrategyAdapterPort,
} from './adapters/strategy.adapter.port';
import { StubStrategyAdapter } from './adapters/stub-strategy.adapter';
import { AudienceController } from './audience.controller';
import { AudienceService } from './audience.service';
import { CampaignTemplateController } from './campaign-template.controller';
import { CampaignTemplateService } from './campaign-template.service';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { AudienceEntity } from './infrastructure/typeorm/audience.entity';
import { BudgetEntity } from './infrastructure/typeorm/budget.entity';
import { CampaignStrategyAssignmentEntity } from './infrastructure/typeorm/campaign-strategy-assignment.entity';
import { CampaignTemplateEntity } from './infrastructure/typeorm/campaign-template.entity';
import { CampaignEntity } from './infrastructure/typeorm/campaign.entity';
import { StrategyGeneratorProcessor } from './workers/strategy-generator.processor';
import { StrategyGeneratorWorkerService } from './workers/strategy-generator.worker';

@Module({
  imports: [
    AuthSharedModule,
    QueueModule,
    LlmModule,
    TypeOrmModule.forFeature([
      CampaignTemplateEntity,
      CampaignEntity,
      BudgetEntity,
      AudienceEntity,
      CampaignStrategyAssignmentEntity,
      CompanyProfileEntity,
    ]),
  ],
  controllers: [CampaignTemplateController, CampaignController, AudienceController],
  providers: [
    CampaignTemplateService,
    CampaignService,
    AudienceService,
    StrategyGeneratorWorkerService,
    StrategyGeneratorProcessor,
    StubStrategyAdapter,
    OpenRouterStrategyAdapter,
    {
      provide: STRATEGY_ADAPTER,
      useFactory: (
        stub: StubStrategyAdapter,
        llm: OpenRouterStrategyAdapter,
        providers: LlmProviderService,
      ): StrategyAdapterPort => ({
        generate: async (context) => {
          if (await providers.hasActiveConfigured()) {
            return llm.generate(context);
          }
          return stub.generate(context);
        },
      }),
      inject: [StubStrategyAdapter, OpenRouterStrategyAdapter, LlmProviderService],
    },
  ],
})
export class CampaignModule {}
