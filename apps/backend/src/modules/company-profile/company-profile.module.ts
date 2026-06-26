import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { CompanyProfileController } from './company-profile.controller';
import { CompanyProfileService } from './company-profile.service';
import { CompanyProfileSectionEntity } from './infrastructure/typeorm/company-profile-section.entity';
import { CompanyProfileEntity } from './infrastructure/typeorm/company-profile.entity';
import { OutboxEntity } from './infrastructure/typeorm/outbox.entity';
import { CompletionCalculatorService } from './services/completion-calculator.service';
import { OutboxWriterService } from './services/outbox-writer.service';

@Module({
  imports: [
    AuthSharedModule,
    TypeOrmModule.forFeature([
      CompanyProfileEntity,
      CompanyProfileSectionEntity,
      OutboxEntity,
    ]),
  ],
  controllers: [CompanyProfileController],
  providers: [
    CompanyProfileService,
    CompletionCalculatorService,
    OutboxWriterService,
  ],
  exports: [CompanyProfileService],
})
export class CompanyProfileModule {}
