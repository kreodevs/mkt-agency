import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmModule } from '../../shared/ai/llm.module';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { FormEntity } from '../forms/infrastructure/typeorm/form.entity';
import { OpenRouterScoringAdapter } from './adapters/openrouter-scoring.adapter';
import {
  SCORING_ADAPTER,
  ScoringAdapterPort,
} from './adapters/scoring.adapter.port';
import { StubScoringAdapter } from './adapters/stub-scoring.adapter';
import { AddInteractionHandler } from './commands/add-interaction.handler';
import { DeleteLeadHandler } from './commands/delete-lead.handler';
import { SubmitFormHandler } from './commands/submit-form.handler';
import { LeadInteractionEntity } from './infrastructure/typeorm/lead-interaction.entity';
import { LeadEntity } from './infrastructure/typeorm/lead.entity';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import { LeadScoringService } from './services/lead-scoring.service';

@Module({
  imports: [
    AuthSharedModule,
    LlmModule,
    TypeOrmModule.forFeature([LeadEntity, LeadInteractionEntity, FormEntity]),
  ],
  controllers: [LeadController],
  providers: [
    LeadService,
    LeadScoringService,
    AddInteractionHandler,
    DeleteLeadHandler,
    SubmitFormHandler,
    StubScoringAdapter,
    OpenRouterScoringAdapter,
    {
      provide: SCORING_ADAPTER,
      useFactory: (
        stub: StubScoringAdapter,
        llm: OpenRouterScoringAdapter,
        providers: LlmProviderService,
      ): ScoringAdapterPort => ({
        score: async (context) => {
          if (await providers.hasActiveConfigured()) {
            return llm.score(context);
          }
          return stub.score(context);
        },
      }),
      inject: [StubScoringAdapter, OpenRouterScoringAdapter, LlmProviderService],
    },
  ],
  exports: [SubmitFormHandler, LeadScoringService, AddInteractionHandler],
})
export class CrmModule {}
