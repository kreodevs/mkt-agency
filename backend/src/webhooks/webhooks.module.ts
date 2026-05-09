import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { Trial } from '../trials/entities/trial.entity';
import { Lead } from '../leads/entities/lead.entity';
import { Proposal } from '../proposals/entities/proposal.entity';
import { ProposalsModule } from '../proposals/proposals.module';

@Module({
  imports: [TypeOrmModule.forFeature([Trial, Lead, Proposal]), ProposalsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}