import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { OutboxEntity } from '../company-profile/infrastructure/typeorm/outbox.entity';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ContentApprovalEntity } from './infrastructure/typeorm/content-approval.entity';
import { ContentVersionEntity } from './infrastructure/typeorm/content-version.entity';
import { ContentEntity } from './infrastructure/typeorm/content.entity';
import { EventEntity } from './infrastructure/typeorm/event.entity';
import { ContentEventSourcingService } from './services/content-event-sourcing.service';
import { DigitalSignatureService } from './services/digital-signature.service';

@Module({
  imports: [
    AuthSharedModule,
    TypeOrmModule.forFeature([
      ContentEntity,
      ContentVersionEntity,
      ContentApprovalEntity,
      EventEntity,
      OutboxEntity,
      CampaignEntity,
    ]),
  ],
  controllers: [ContentController],
  providers: [ContentService, DigitalSignatureService, ContentEventSourcingService],
  exports: [ContentService],
})
export class ContentModule {}
