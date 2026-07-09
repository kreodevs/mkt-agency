import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { LlmModule } from '../../shared/ai/llm.module';
import { QueueModule } from '../../shared/queue/queue.module';
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
import { AgentActivationService } from './services/agent-activation.service';
import { AgentEventService } from './services/agent-event.service';
import { AnalyticsAgentService } from './services/analytics-agent.service';
import { CreativeAgentService } from './services/creative-agent.service';
import { OperatingProfileService } from './services/operating-profile.service';
import { StrategistAgentService } from './services/strategist-agent.service';
import { WeeklyBalanceService } from './services/weekly-balance.service';
import { WeeklyBalanceProcessor } from './workers/weekly-balance.processor';
import { WeeklyBalanceWorkerService } from './workers/weekly-balance.worker';

@Module({
  imports: [
    AuthSharedModule,
    LlmModule,
    QueueModule,
    TypeOrmModule.forFeature([
      TenantEntity,
      PackageEntity,
      ProductEntity,
      LeadEntity,
      AgentEventLogEntity,
      AgentPlanEntity,
    ]),
  ],
  controllers: [TenantOperatingProfileController, AgencyAgentsController],
  providers: [
    OperatingProfileService,
    AgentActivationService,
    AgentEventService,
    AnalyticsAgentService,
    CreativeAgentService,
    StrategistAgentService,
    WeeklyBalanceService,
    WeeklyBalanceWorkerService,
    WeeklyBalanceProcessor,
    GrowthProfileGuard,
    PaidBudgetGuard,
  ],
  exports: [
    OperatingProfileService,
    AgentActivationService,
    AgentEventService,
    AnalyticsAgentService,
    CreativeAgentService,
    GrowthProfileGuard,
    PaidBudgetGuard,
  ],
})
export class AgencyAgentsModule {}
