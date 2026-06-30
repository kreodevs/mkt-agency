import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { TriggerAnalysisDto, UpdateSuggestionDto } from './dto/strategy.request.dto';
import {
  StrategyAdjustmentResponse,
  TriggerAnalysisResponse,
} from './dto/strategy.response.dto';
import { StrategyService } from './strategy.service';

@Controller('strategy')
@UseGuards(TenantGuard)
export class StrategyController {
  constructor(private readonly strategyService: StrategyService) {}

  @Get('adjustments')
  list(@CurrentUser() user: AuthenticatedUser): Promise<StrategyAdjustmentResponse[]> {
    return this.strategyService.list(user.tenantId!);
  }

  @Post('adjustments/analyze')
  @HttpCode(HttpStatus.CREATED)
  triggerAnalysis(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TriggerAnalysisDto,
  ): Promise<TriggerAnalysisResponse> {
    return this.strategyService.triggerAnalysis(user.tenantId!, {
      brandBriefId: dto.brandBriefId,
      productId: dto.productId,
    });
  }

  @Get('adjustments/:id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<StrategyAdjustmentResponse> {
    return this.strategyService.findOne(user.tenantId!, id);
  }

  @Patch('adjustments/:id/suggestions/:suggestionId')
  updateSuggestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('suggestionId') suggestionId: string,
    @Body() dto: UpdateSuggestionDto,
  ): Promise<StrategyAdjustmentResponse> {
    return this.strategyService.updateSuggestion(user.tenantId!, id, suggestionId, dto.status);
  }

  @Post('adjustments/:id/apply')
  applyApproved(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<StrategyAdjustmentResponse> {
    return this.strategyService.applyApproved(user.tenantId!, id);
  }
}