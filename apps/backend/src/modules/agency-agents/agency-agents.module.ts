import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { LlmModule } from '../../shared/ai/llm.module';
import { QueueModule } from '../../shared/queue/queue.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { PaidMediaModule } from '../paid-media/paid-media.module';
import { CompanyProfileModule } from '../company-profile/company-profile.module';
import { ProductModule } from '../product/product.module';
import { PublicationInboxModule } from '../publication-inbox/publication-inbox.module';
import { CampaignTemplateEntity } from '../campaign/infrastructure/typeorm/campaign-template.entity';
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { CompanyProfileSectionEntity } from '../company-profile/infrastructure/typeorm/company-profile-section.entity';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import { PackageEntity } from '../packages/infrastructure/typeorm/package.entity';
import { TenantEntity } from '../tenant/infrastructure/typeorm/tenant.entity';
import { LeadEntity } from '../crm/infrastructure/typeorm/lead.entity';
import {
  AgencyAgentsController,
  TenantOperatingProfileController,
} from './agency-agents.controller';
import { GrowthProfileGuard } from './guards/growth-profile.guard';
import { PaidBudgetGuard } from './guards/paid-budget.guard';
import { AgentEventLogEntity } from './infrastructure/typeorm/agent-event-log.entity';
import { AgentPlanEntity } from './infrastructure/typeorm/agent-plan.entity';
import { CreativePackEntity } from './infrastructure/typeorm/creative-pack.entity';
import { AdPerformanceImportEntity } from './infrastructure/typeorm/ad-performance-import.entity';
import { AgentActivationService } from './services/agent-activation.service';
import { AgentEventService } from './services/agent-event.service';
import { AnalyticsAgentService } from './services/analytics-agent.service';
import { AdPerformanceImportService } from './services/ad-performance-import.service';
import { CreativeAgentService } from './services/creative-agent.service';
import { OperatingProfileService } from './services/operating-profile.service';
import { StrategistAgentService } from './services/strategist-agent.service';
import { WeeklyBalanceService } from './services/weekly-balance.service';
import { WeeklyBalanceProcessor } from './workers/weekly-balance.processor';
import { WeeklyBalanceWorkerService } from './workers/weekly-balance.worker';
import { ExecutiveReportService } from './services/executive-report.service';
import { CampaignTemplateSuggestionService } from './services/campaign-template-suggestion.service';

@Module({
  imports: [
    AuthSharedModule,
    LlmModule,
    QueueModule,
    KnowledgeModule,
    CompanyProfileModule,
    ProductModule,
    forwardRef(() => PublicationInboxModule),
    forwardRef(() => PaidMediaModule),
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
    TypeOrmModule.forFeature([
      TenantEntity,
      PackageEntity,
      ProductEntity,
      LeadEntity,
      AgentEventLogEntity,
      AgentPlanEntity,
      CreativePackEntity,
      AdPerformanceImportEntity,
      CampaignTemplateEntity,
      CompanyProfileEntity,
      CompanyProfileSectionEntity,
    ]),
  ],
  controllers: [TenantOperatingProfileController, AgencyAgentsController],
  providers: [
    OperatingProfileService,
    AgentActivationService,
    AgentEventService,
    AnalyticsAgentService,
    AdPerformanceImportService,
    CreativeAgentService,
    StrategistAgentService,
    WeeklyBalanceService,
    WeeklyBalanceWorkerService,
    WeeklyBalanceProcessor,
    ExecutiveReportService,
    CampaignTemplateSuggestionService,
    GrowthProfileGuard,
    PaidBudgetGuard,
  ],
  exports: [
    OperatingProfileService,
    AgentActivationService,
    AgentEventService,
    AnalyticsAgentService,
    AdPerformanceImportService,
    CreativeAgentService,
    ExecutiveReportService,
    CampaignTemplateSuggestionService,
    GrowthProfileGuard,
    PaidBudgetGuard,
  ],
})
export class AgencyAgentsModule {}
