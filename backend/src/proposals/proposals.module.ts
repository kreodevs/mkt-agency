import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProposalsController } from './proposals.controller';
import { ProposalsService } from './proposals.service';
import { ProposalExecutorService } from './proposal-executor.service';
import { ProposalNotifierService } from './proposal-notifier.service';
import { Proposal } from './entities/proposal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal])],
  controllers: [ProposalsController],
  providers: [ProposalsService, ProposalExecutorService, ProposalNotifierService],
  exports: [ProposalsService, ProposalExecutorService, ProposalNotifierService],
})
export class ProposalsModule {}
