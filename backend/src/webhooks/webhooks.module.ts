import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { Trial } from '../trials/entities/trial.entity';
import { Lead } from '../leads/entities/lead.entity';
import { Proposal } from '../proposals/entities/proposal.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantUser } from '../users/entities/tenant-user.entity';
import { Product } from '../products/entities/product.entity';
import { ProposalsModule } from '../proposals/proposals.module';

@Module({
  imports: [TypeOrmModule.forFeature([Trial, Lead, Proposal, Tenant, TenantUser, Product]), ProposalsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}