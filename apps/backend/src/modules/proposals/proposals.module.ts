import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmModule } from '../../shared/ai/llm.module';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { QueueModule } from '../../shared/queue/queue.module';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { OutboxEntity } from '../company-profile/infrastructure/typeorm/outbox.entity';
import { OpenRouterProposalAdapter } from './adapters/openrouter-proposal.adapter';
import {
  PROPOSAL_ADAPTER,
  ProposalAdapterPort,
} from './adapters/proposal.adapter.port';
import { StubProposalAdapter } from './adapters/stub-proposal.adapter';
import { ProposalEntity } from './infrastructure/typeorm/proposal.entity';
import { ProposalController } from './proposal.controller';
import { ProposalService } from './proposal.service';
import { ProposalSignatureService } from './services/proposal-signature.service';
import { ProposalGeneratorProcessor } from './workers/proposal-generator.processor';
import { ProposalGeneratorWorkerService } from './workers/proposal-generator.worker';

@Module({
  imports: [
    AuthSharedModule,
    QueueModule,
    LlmModule,
    ConfigModule,
    TypeOrmModule.forFeature([
      ProposalEntity,
      CampaignEntity,
      CompanyProfileEntity,
      OutboxEntity,
    ]),
  ],
  controllers: [ProposalController],
  providers: [
    ProposalService,
    ProposalSignatureService,
    ProposalGeneratorWorkerService,
    ProposalGeneratorProcessor,
    StubProposalAdapter,
    OpenRouterProposalAdapter,
    {
      provide: PROPOSAL_ADAPTER,
      useFactory: (
        config: ConfigService,
        stub: StubProposalAdapter,
        llm: OpenRouterProposalAdapter,
      ): ProposalAdapterPort => {
        return config.get<string>('AI_API_KEY') ? llm : stub;
      },
      inject: [ConfigService, StubProposalAdapter, OpenRouterProposalAdapter],
    },
  ],
  exports: [ProposalService],
})
export class ProposalsModule {}
