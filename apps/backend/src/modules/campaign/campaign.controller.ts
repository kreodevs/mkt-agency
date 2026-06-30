import {
  Body,
  Controller,
  Delete,
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
import { CampaignService } from './campaign.service';
import { CampaignOrchestrationService } from './campaign-orchestration.service';
import {
  CreateCampaignDto,
  ListCampaignsQueryDto,
  UpdateBudgetDto,
  UpdateCampaignDto,
} from './dto/campaign.request.dto';
import {
  BudgetResponseDto,
  CampaignResponseDto,
  GenerateStrategyAcceptedDto,
  PaginatedCampaignsResponseDto,
  StrategyAssignmentResponseDto,
} from './dto/campaign.response.dto';
import {
  AutoGenerateCampaignDto,
} from './dto/campaign-orchestration.request.dto';
import {
  AutoGenerateCampaignResponse,
  CampaignAgentReadinessResponse,
} from './dto/campaign-orchestration.response.dto';
import {
  CampaignExecutionMode,
  DEFAULT_CAMPAIGN_EXECUTION_MODE,
} from './domain/campaign-execution-mode.constants';

@Controller('campaigns')
@UseGuards(TenantGuard)
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly orchestration: CampaignOrchestrationService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCampaignsQueryDto,
  ): Promise<PaginatedCampaignsResponseDto> {
    return this.campaignService.list(user.tenantId!, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateCampaignDto,
  ): Promise<CampaignResponseDto> {
    return this.campaignService.create(user.tenantId!, body);
  }

  @Get('agent-readiness')
  getAgentReadiness(
    @CurrentUser() user: AuthenticatedUser,
    @Query('mode') mode?: string,
  ): Promise<CampaignAgentReadinessResponse> {
    const executionMode: CampaignExecutionMode = mode === 'paid' ? 'paid' : DEFAULT_CAMPAIGN_EXECUTION_MODE;
    return this.orchestration.getAgentReadiness(user.tenantId!, executionMode);
  }

  @Post('auto-generate')
  @HttpCode(HttpStatus.CREATED)
  autoGenerate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AutoGenerateCampaignDto,
  ): Promise<AutoGenerateCampaignResponse> {
    return this.orchestration.autoGenerateFromAgents(user.tenantId!, body);
  }

  @Get('strategy-assignments/:assignmentId')
  getStrategyAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
  ): Promise<StrategyAssignmentResponseDto> {
    return this.campaignService.getStrategyAssignment(user.tenantId!, assignmentId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CampaignResponseDto> {
    return this.campaignService.findOne(user.tenantId!, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCampaignDto,
  ): Promise<CampaignResponseDto> {
    return this.campaignService.update(user.tenantId!, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.campaignService.remove(user.tenantId!, id);
  }

  @Post(':id/generate-strategy')
  @HttpCode(HttpStatus.ACCEPTED)
  generateStrategy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GenerateStrategyAcceptedDto> {
    return this.campaignService.requestStrategyGeneration(user.tenantId!, id);
  }

  @Get(':id/budgets')
  listBudgets(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BudgetResponseDto[]> {
    return this.campaignService.listBudgets(user.tenantId!, id);
  }

  @Patch(':id/budgets/:budgetId')
  updateBudget(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
    @Body() body: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    return this.campaignService.updateBudget(user.tenantId!, id, budgetId, body);
  }
}
