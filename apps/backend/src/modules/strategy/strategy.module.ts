import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmModule } from '../../shared/ai/llm.module';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { DashboardModule } from '../dashboard/dashboard.module';
import { OpenRouterStrategyAdapter } from './adapters/openrouter-strategy.adapter';
import { StubStrategyAdapter } from './adapters/stub-strategy.adapter';
import { STRATEGY_ADAPTER, StrategyAdjustmentAdapterPort } from './adapters/strategy.adapter.port';
import { StrategyAdjustmentEntity } from './infrastructure/typeorm/strategy-adjustment.entity';
import { StrategyController } from './strategy.controller';
import { StrategyService } from './strategy.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StrategyAdjustmentEntity, CampaignEntity]),
    LlmModule,
    DashboardModule,
  ],
  controllers: [StrategyController],
  providers: [
    StrategyService,
    StubStrategyAdapter,
    OpenRouterStrategyAdapter,
    {
      provide: STRATEGY_ADAPTER,
      useFactory: (
        stub: StubStrategyAdapter,
        llm: OpenRouterStrategyAdapter,
        providers: LlmProviderService,
      ): StrategyAdjustmentAdapterPort => ({
        analyze: async (context) => {
          if (await providers.hasActiveConfigured()) {
            return llm.analyze(context);
          }
          return stub.analyze(context);
        },
      }),
      inject: [StubStrategyAdapter, OpenRouterStrategyAdapter, LlmProviderService],
    },
  ],
  exports: [StrategyService],
})
export class StrategyModule {}