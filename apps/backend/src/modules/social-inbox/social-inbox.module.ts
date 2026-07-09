import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmModule } from '../../shared/ai/llm.module';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { AgencyAgentsModule } from '../agency-agents/agency-agents.module';
import { CrmModule } from '../crm/crm.module';
import { TenantEntity } from '../tenant/infrastructure/typeorm/tenant.entity';
import { LeadEntity } from '../crm/infrastructure/typeorm/lead.entity';
import { SocialInteractionEntity } from './infrastructure/typeorm/social-interaction.entity';
import { IntentClassifierService } from './services/intent-classifier.service';
import { SocialInboxService } from './services/social-inbox.service';
import { TenantWebhookService } from './services/tenant-webhook.service';
import { SocialInboxController } from './social-inbox.controller';
import { SocialInboxWebhookController } from './social-inbox-webhook.controller';
import { TenantWebhookInfoController } from './tenant-webhook-info.controller';

@Module({
  imports: [
    AuthSharedModule,
    LlmModule,
    AgencyAgentsModule,
    CrmModule,
    TypeOrmModule.forFeature([SocialInteractionEntity, LeadEntity, TenantEntity]),
  ],
  controllers: [
    SocialInboxController,
    SocialInboxWebhookController,
    TenantWebhookInfoController,
  ],
  providers: [SocialInboxService, IntentClassifierService, TenantWebhookService],
  exports: [SocialInboxService, TenantWebhookService],
})
export class SocialInboxModule {}
