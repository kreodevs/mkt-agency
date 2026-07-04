import 'reflect-metadata';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { SessionEntity } from '../modules/auth/infrastructure/typeorm/session.entity';
import { AuditLogEntity } from '../modules/users/infrastructure/typeorm/audit-log.entity';
import { AudienceEntity } from '../modules/campaign/infrastructure/typeorm/audience.entity';
import { BudgetEntity } from '../modules/campaign/infrastructure/typeorm/budget.entity';
import { CampaignStrategyAssignmentEntity } from '../modules/campaign/infrastructure/typeorm/campaign-strategy-assignment.entity';
import { CampaignTemplateEntity } from '../modules/campaign/infrastructure/typeorm/campaign-template.entity';
import { CampaignEntity } from '../modules/campaign/infrastructure/typeorm/campaign.entity';
import { CompanyProfileSectionEntity } from '../modules/company-profile/infrastructure/typeorm/company-profile-section.entity';
import { CompanyProfileEntity } from '../modules/company-profile/infrastructure/typeorm/company-profile.entity';
import { OutboxEntity } from '../modules/company-profile/infrastructure/typeorm/outbox.entity';
import { SectionSuggestionAssignmentEntity } from '../modules/company-profile/infrastructure/typeorm/section-suggestion-assignment.entity';
import { AssetEntity } from '../modules/assets/infrastructure/typeorm/asset.entity';
import { AssetFolderEntity } from '../modules/assets/infrastructure/typeorm/asset-folder.entity';
import { AssetTagAssignmentEntity } from '../modules/assets/infrastructure/typeorm/asset-tag-assignment.entity';
import { AssetTagEntity } from '../modules/assets/infrastructure/typeorm/asset-tag.entity';
import { CompetitorMentionEntity } from '../modules/competitors/infrastructure/typeorm/competitor-mention.entity';
import { CompetitorEntity } from '../modules/competitors/infrastructure/typeorm/competitor.entity';
import { LeadInteractionEntity } from '../modules/crm/infrastructure/typeorm/lead-interaction.entity';
import { LeadEntity } from '../modules/crm/infrastructure/typeorm/lead.entity';
import { ContentApprovalEntity } from '../modules/content/infrastructure/typeorm/content-approval.entity';
import { ContentVersionEntity } from '../modules/content/infrastructure/typeorm/content-version.entity';
import { ContentEntity } from '../modules/content/infrastructure/typeorm/content.entity';
import { EventEntity } from '../modules/content/infrastructure/typeorm/event.entity';
import { CustomDomainEntity } from '../modules/domains/infrastructure/typeorm/custom-domain.entity';
import { DnsVerificationEntity } from '../modules/domains/infrastructure/typeorm/dns-verification.entity';
import { FormSubmissionEntity } from '../modules/forms/infrastructure/typeorm/form-submission.entity';
import { FormEntity } from '../modules/forms/infrastructure/typeorm/form.entity';
import { ProposalEntity } from '../modules/proposals/infrastructure/typeorm/proposal.entity';
import { ReportEntity } from '../modules/reports/infrastructure/typeorm/report.entity';
import { SecurityEventEntity } from '../modules/security/infrastructure/typeorm/security-event.entity';
import { ImpersonationLogEntity } from '../modules/superadmin/infrastructure/typeorm/impersonation-log.entity';
import { ProductEntity } from '../modules/product/infrastructure/typeorm/product.entity';
import { ProductMediaKitItemEntity } from '../modules/product/infrastructure/typeorm/product-media-kit-item.entity';
import { TenantEntity } from '../modules/tenant/infrastructure/typeorm/tenant.entity';
import { UserEntity } from '../shared/infrastructure/typeorm/user.entity';
import {
  resolveDatabaseName,
  resolveDatabasePassword,
  resolveDatabaseUser,
} from '../shared/config/database.config';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: resolveDatabaseUser(),
  password: resolveDatabasePassword(),
  database: resolveDatabaseName(),
  entities: [
    UserEntity,
    TenantEntity,
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
    ProductEntity,
    ProductMediaKitItemEntity,
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
  migrations: [
    join(
      __dirname,
      'migrations',
      __filename.endsWith('.js') ? '*.js' : '*.ts',
    ),
  ],
  migrationsTableName: 'typeorm_migrations',
});
