import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiAgentsModule } from '../ai-agents/ai-agents.module';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { QueueModule } from '../../shared/queue/queue.module';
import { CompanyProfileController } from './company-profile.controller';
import { CompanyProfileService } from './company-profile.service';
import { CompanyProfileSectionEntity } from './infrastructure/typeorm/company-profile-section.entity';
import { CompanyProfileEntity } from './infrastructure/typeorm/company-profile.entity';
import { OutboxEntity } from './infrastructure/typeorm/outbox.entity';
import { SectionSuggestionAssignmentEntity } from './infrastructure/typeorm/section-suggestion-assignment.entity';
import { CompletionCalculatorService } from './services/completion-calculator.service';
import { ProfileSectionSyncService } from './services/profile-section-sync.service';
import { OutboxWriterService } from './services/outbox-writer.service';
import { SuggestionProcessor } from './workers/suggestion.processor';
import { SuggestionWorkerService } from './workers/suggestion.worker';

@Module({
  imports: [
    AuthSharedModule,
    AiAgentsModule,
    QueueModule,
    TypeOrmModule.forFeature([
      CompanyProfileEntity,
      CompanyProfileSectionEntity,
      OutboxEntity,
      SectionSuggestionAssignmentEntity,
    ]),
  ],
  controllers: [CompanyProfileController],
  providers: [
    CompanyProfileService,
    CompletionCalculatorService,
    ProfileSectionSyncService,
    OutboxWriterService,
    SuggestionWorkerService,
    SuggestionProcessor,
  ],
  exports: [CompanyProfileService, ProfileSectionSyncService],
})
export class CompanyProfileModule {}
