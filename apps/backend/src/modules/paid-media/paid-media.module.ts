import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { AgencyAgentsModule } from '../agency-agents/agency-agents.module';
import { AgentPlanEntity } from '../agency-agents/infrastructure/typeorm/agent-plan.entity';
import { CreativePackEntity } from '../agency-agents/infrastructure/typeorm/creative-pack.entity';
import { MediaCampaignIntentEntity } from './infrastructure/typeorm/media-campaign-intent.entity';
import { PaidMediaController } from './paid-media.controller';
import { MediaBuyerStubService } from './services/media-buyer-stub.service';

@Module({
  imports: [
    AuthSharedModule,
    forwardRef(() => AgencyAgentsModule),
    TypeOrmModule.forFeature([
      MediaCampaignIntentEntity,
      CreativePackEntity,
      AgentPlanEntity,
    ]),
  ],
  controllers: [PaidMediaController],
  providers: [MediaBuyerStubService],
  exports: [MediaBuyerStubService],
})
export class PaidMediaModule {}
