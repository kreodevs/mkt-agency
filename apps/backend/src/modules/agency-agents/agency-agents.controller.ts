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
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { CreativeAgentService } from './services/creative-agent.service';
import { OperatingProfileService } from './services/operating-profile.service';
import { StrategistAgentService } from './services/strategist-agent.service';
import { AdPerformanceImportService } from './services/ad-performance-import.service';
import { ExecutiveReportService } from './services/executive-report.service';
import { CampaignTemplateSuggestionService } from './services/campaign-template-suggestion.service';
import { OwnerNotificationService } from '../publication-inbox/services/owner-notification.service';

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
    private readonly creative: CreativeAgentService,
    private readonly adImports: AdPerformanceImportService,
    private readonly executiveReport: ExecutiveReportService,
    private readonly templateSuggestions: CampaignTemplateSuggestionService,
    @Inject(forwardRef(() => OwnerNotificationService))
    private readonly ownerNotifications: OwnerNotificationService,
  ) {}

  @Get('executive-report')
  getExecutiveReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query('productId') productId?: string,
  ) {
    return this.executiveReport.getLatest(user.tenantId!, productId);
  }

  @Post('executive-report/generate')
  @HttpCode(HttpStatus.OK)
  async generateExecutiveReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query('productId') productId?: string,
  ) {
    const report = await this.executiveReport.generateForTenant(
      user.tenantId!,
      productId,
      {
        onGenerated: async (payload) => {
          await this.ownerNotifications.notifyExecutiveReport(user.tenantId!, payload);
        },
      },
    );
    return report;
  }

  @Get('campaign-template-suggestions')
  getCampaignTemplateSuggestions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('productId') productId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.templateSuggestions.suggestForProduct(
      user.tenantId!,
      productId,
      limit ? parseInt(limit, 10) : 3,
    );
  }

  @Get('performance/paid')
  getPaidPerformance(
    @CurrentUser() user: AuthenticatedUser,
    @Query('productId') productId?: string,
    @Query('periodDays') periodDays?: string,
  ) {
    return this.analytics.getPaidPerformanceCrossSummary(
      user.tenantId!,
      productId,
      periodDays ? parseInt(periodDays, 10) : 30,
    );
  }

  @Get('performance/imports')
  listPerformanceImports(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
  ) {
    return this.adImports.listImports(
      user.tenantId!,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post('performance/import')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  importPerformanceCsv(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('productId') productId?: string,
    @Body('platform') platform?: 'meta' | 'google' | 'auto',
  ) {
    return this.adImports.importCsv(user.tenantId!, user.id, file, {
      productId: productId?.trim() || undefined,
      platform: platform ?? 'auto',
    });
  }

  @Get('performance')
  getPerformance(
    @CurrentUser() user: AuthenticatedUser,
    @Query('productId') productId?: string,
  ) {
    return this.analytics.getLeadPerformanceSummary(user.tenantId!, productId);
  }

  @Get('anomalies')
  getAnomalies(
    @CurrentUser() user: AuthenticatedUser,
    @Query('productId') productId?: string,
  ) {
    return this.analytics.detectAnomalies(user.tenantId!, productId);
  }

  @Get('attribution')
  getAttribution(
    @CurrentUser() user: AuthenticatedUser,
    @Query('model') model?: 'first_touch' | 'last_touch',
    @Query('productId') productId?: string,
    @Query('periodDays') periodDays?: string,
  ) {
    return this.analytics.getAttributionReport(
      user.tenantId!,
      model === 'first_touch' ? 'first_touch' : 'last_touch',
      productId,
      periodDays ? parseInt(periodDays, 10) : 30,
    );
  }

  @Get('creative-packs')
  listCreativePacks(@CurrentUser() user: AuthenticatedUser) {
    return this.creative.listPacks(user.tenantId!);
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
