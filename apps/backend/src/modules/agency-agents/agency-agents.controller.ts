import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import {
  CreateAgencyPlanDto,
  UpdateOperatingProfileDto,
} from './dto/agency-plan.request.dto';
import {
  toAgentEventResponse,
  toAgentPlanResponse,
  toOperatingProfileResponse,
  type AgentEventResponseDto,
  type AgentPlanResponseDto,
  type OperatingProfileResponseDto,
} from './dto/agency-agents.response.dto';
import { GrowthProfileGuard } from './guards/growth-profile.guard';
import { AgentActivationService } from './services/agent-activation.service';
import { AgentEventService } from './services/agent-event.service';
import { AnalyticsAgentService } from './services/analytics-agent.service';
import { OperatingProfileService } from './services/operating-profile.service';
import { StrategistAgentService } from './services/strategist-agent.service';

@Controller('tenant')
@UseGuards(TenantGuard)
export class TenantOperatingProfileController {
  constructor(
    private readonly operatingProfile: OperatingProfileService,
    private readonly activation: AgentActivationService,
  ) {}

  @Get('operating-profile')
  async getOperatingProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OperatingProfileResponseDto> {
    const snapshot = await this.activation.getCapabilities(user.tenantId!);
    return toOperatingProfileResponse(snapshot);
  }

  @Patch('operating-profile')
  async updateOperatingProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateOperatingProfileDto,
  ): Promise<OperatingProfileResponseDto> {
    await this.operatingProfile.updateProfile(user.tenantId!, body);
    const snapshot = await this.activation.getCapabilities(user.tenantId!);
    return toOperatingProfileResponse(snapshot);
  }
}

@Controller('agency')
@UseGuards(TenantGuard)
export class AgencyAgentsController {
  constructor(
    private readonly strategist: StrategistAgentService,
    private readonly agentEvents: AgentEventService,
    private readonly analytics: AnalyticsAgentService,
  ) {}

  @Get('performance')
  getPerformance(
    @CurrentUser() user: AuthenticatedUser,
    @Query('productId') productId?: string,
  ) {
    return this.analytics.getLeadPerformanceSummary(user.tenantId!, productId);
  }

  @Get('events')
  listEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Query('productId') productId?: string,
    @Query('limit') limit?: string,
  ): Promise<AgentEventResponseDto[]> {
    return this.agentEvents
      .listForTenant(user.tenantId!, {
        productId,
        limit: limit ? parseInt(limit, 10) : 50,
      })
      .then((rows) => rows.map(toAgentEventResponse));
  }

  @Get('plans')
  @UseGuards(GrowthProfileGuard)
  listPlans(@CurrentUser() user: AuthenticatedUser): Promise<AgentPlanResponseDto[]> {
    return this.strategist.listPlans(user.tenantId!).then((rows) => rows.map(toAgentPlanResponse));
  }

  @Get('plans/:id')
  @UseGuards(GrowthProfileGuard)
  getPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AgentPlanResponseDto> {
    return this.strategist.getPlan(user.tenantId!, id).then(toAgentPlanResponse);
  }

  @Post('plans')
  @UseGuards(GrowthProfileGuard)
  @HttpCode(HttpStatus.CREATED)
  createPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateAgencyPlanDto,
  ): Promise<AgentPlanResponseDto> {
    return this.strategist
      .createPlan(user.tenantId!, user.id, body)
      .then(toAgentPlanResponse);
  }

  @Post('plans/:id/approve')
  @UseGuards(GrowthProfileGuard)
  @HttpCode(HttpStatus.OK)
  approvePlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AgentPlanResponseDto> {
    return this.strategist
      .approvePlan(user.tenantId!, user.id, id)
      .then(toAgentPlanResponse);
  }
}
