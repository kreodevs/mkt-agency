import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { SessionEntity } from './modules/auth/infrastructure/typeorm/session.entity';
import { SecurityModule } from './modules/security/security.module';
import { SecurityEventEntity } from './modules/security/infrastructure/typeorm/security-event.entity';
import { SetupModule } from './modules/setup/setup.module';
import { SuperadminModule } from './modules/superadmin/superadmin.module';
import { ImpersonationLogEntity } from './modules/superadmin/infrastructure/typeorm/impersonation-log.entity';
import { TenantModule } from './modules/tenant/tenant.module';
import { CompanyProfileModule } from './modules/company-profile/company-profile.module';
import { CompanyProfileEntity } from './modules/company-profile/infrastructure/typeorm/company-profile.entity';
import { CompanyProfileSectionEntity } from './modules/company-profile/infrastructure/typeorm/company-profile-section.entity';
import { OutboxEntity } from './modules/company-profile/infrastructure/typeorm/outbox.entity';
import { SectionSuggestionAssignmentEntity } from './modules/company-profile/infrastructure/typeorm/section-suggestion-assignment.entity';
import { CampaignModule } from './modules/campaign/campaign.module';
import { AudienceEntity } from './modules/campaign/infrastructure/typeorm/audience.entity';
import { BudgetEntity } from './modules/campaign/infrastructure/typeorm/budget.entity';
import { CampaignStrategyAssignmentEntity } from './modules/campaign/infrastructure/typeorm/campaign-strategy-assignment.entity';
import { CampaignTemplateEntity } from './modules/campaign/infrastructure/typeorm/campaign-template.entity';
import { CampaignEntity } from './modules/campaign/infrastructure/typeorm/campaign.entity';
import { ContentModule } from './modules/content/content.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { AssetsModule } from './modules/assets/assets.module';
import { AssetEntity } from './modules/assets/infrastructure/typeorm/asset.entity';
import { AssetFolderEntity } from './modules/assets/infrastructure/typeorm/asset-folder.entity';
import { AssetTagEntity } from './modules/assets/infrastructure/typeorm/asset-tag.entity';
import { AssetTagAssignmentEntity } from './modules/assets/infrastructure/typeorm/asset-tag-assignment.entity';
import { DomainsModule } from './modules/domains/domains.module';
import { CustomDomainEntity } from './modules/domains/infrastructure/typeorm/custom-domain.entity';
import { DnsVerificationEntity } from './modules/domains/infrastructure/typeorm/dns-verification.entity';
import { ProposalsModule } from './modules/proposals/proposals.module';
import { ProposalEntity } from './modules/proposals/infrastructure/typeorm/proposal.entity';
import { ReportsModule } from './modules/reports/reports.module';
import { ReportEntity } from './modules/reports/infrastructure/typeorm/report.entity';
import { CompetitorsModule } from './modules/competitors/competitors.module';
import { CompetitorEntity } from './modules/competitors/infrastructure/typeorm/competitor.entity';
import { CompetitorMentionEntity } from './modules/competitors/infrastructure/typeorm/competitor-mention.entity';
import { AuditModule } from './modules/audit/audit.module';
import { CrmModule } from './modules/crm/crm.module';
import { FormsModule } from './modules/forms/form.module';
import { FormEntity } from './modules/forms/infrastructure/typeorm/form.entity';
import { FormSubmissionEntity } from './modules/forms/infrastructure/typeorm/form-submission.entity';
import { LeadEntity } from './modules/crm/infrastructure/typeorm/lead.entity';
import { LeadInteractionEntity } from './modules/crm/infrastructure/typeorm/lead-interaction.entity';
import { ContentApprovalEntity } from './modules/content/infrastructure/typeorm/content-approval.entity';
import { ContentVersionEntity } from './modules/content/infrastructure/typeorm/content-version.entity';
import { ContentEntity } from './modules/content/infrastructure/typeorm/content.entity';
import { EventEntity } from './modules/content/infrastructure/typeorm/event.entity';
import { UsersModule } from './modules/users/users.module';
import { AuditLogEntity } from './modules/users/infrastructure/typeorm/audit-log.entity';
import { PackageModule } from './modules/packages/package.module';
import { PackageEntity } from './modules/packages/infrastructure/typeorm/package.entity';
import { LlmTaskConfigEntity } from './modules/platform/infrastructure/typeorm/llm-task-config.entity';
import { TenantEntity } from './modules/tenant/infrastructure/typeorm/tenant.entity';
import { AuthSharedModule } from './shared/auth/auth-shared.module';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { LoggerModule } from './shared/logger/logger.module';
import { RedisModule } from './shared/redis/redis.module';
import { RateLimitGuard } from './modules/auth/guards/rate-limit.guard';
import { UserEntity } from './shared/infrastructure/typeorm/user.entity';
import {
  resolveDatabaseName,
  resolveDatabasePassword,
  resolveDatabaseUser,
} from './shared/config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    LoggerModule,
    RedisModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USER')?.trim() || resolveDatabaseUser(),
        password:
          config.get<string>('DB_PASSWORD')?.trim() ||
          config.get<string>('DB_PASS')?.trim() ||
          resolveDatabasePassword(),
        database: config.get<string>('DB_NAME')?.trim() || resolveDatabaseName(),
        entities: [
          UserEntity,
          TenantEntity,
          PackageEntity,
          LlmTaskConfigEntity,
          SessionEntity,
          SecurityEventEntity,
          ImpersonationLogEntity,
          AuditLogEntity,
          CompanyProfileEntity,
          CompanyProfileSectionEntity,
          OutboxEntity,
          SectionSuggestionAssignmentEntity,
          CampaignTemplateEntity,
          CampaignEntity,
          BudgetEntity,
          AudienceEntity,
          CampaignStrategyAssignmentEntity,
          ContentEntity,
          ContentVersionEntity,
          ContentApprovalEntity,
          EventEntity,
          FormEntity,
          FormSubmissionEntity,
          LeadEntity,
          LeadInteractionEntity,
          AssetEntity,
          AssetFolderEntity,
          AssetTagEntity,
          AssetTagAssignmentEntity,
          CustomDomainEntity,
          DnsVerificationEntity,
          ProposalEntity,
          ReportEntity,
          CompetitorEntity,
          CompetitorMentionEntity,
        ],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    AuthSharedModule,
    AuthModule,
    SetupModule,
    PackageModule,
    TenantModule,
    CompanyProfileModule,
    CampaignModule,
    ContentModule,
    CalendarModule,
    CrmModule,
    FormsModule,
    AssetsModule,
    DomainsModule,
    ProposalsModule,
    ReportsModule,
    CompetitorsModule,
    AuditModule,
    SuperadminModule,
    UsersModule,
    SecurityModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
