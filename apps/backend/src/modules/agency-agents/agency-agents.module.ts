import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { LlmModule } from '../../shared/ai/llm.module';
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
import { OperatingProfileService } from './services/operating-profile.service';
import { StrategistAgentService } from './services/strategist-agent.service';

@Module({
  imports: [
    AuthSharedModule,
    LlmModule,
    TypeOrmModule.forFeature([
      TenantEntity,
      PackageEntity,
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
    StrategistAgentService,
    GrowthProfileGuard,
    PaidBudgetGuard,
  ],
  exports: [
    OperatingProfileService,
    AgentActivationService,
    AgentEventService,
    AnalyticsAgentService,
    GrowthProfileGuard,
    PaidBudgetGuard,
  ],
})
export class AgencyAgentsModule {}
