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
  UseGuards,
} from '@nestjs/common';
import { GrowthProfileGuard } from '../agency-agents/guards/growth-profile.guard';
import { PaidBudgetGuard } from '../agency-agents/guards/paid-budget.guard';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { MediaBuyerStubService } from './services/media-buyer-stub.service';

@Controller('agency/media-intents')
@UseGuards(TenantGuard, GrowthProfileGuard, PaidBudgetGuard)
export class PaidMediaController {
  constructor(private readonly mediaBuyer: MediaBuyerStubService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.mediaBuyer.listIntents(user.tenantId!).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        planId: row.planId,
        creativePackId: row.creativePackId,
        productId: row.productId,
        platform: row.platform,
        name: row.name,
        structure: row.structure,
        dailyBudget: row.dailyBudget ? Number(row.dailyBudget) : null,
        totalBudget: row.totalBudget ? Number(row.totalBudget) : null,
        status: row.status,
        requiresApproval: row.requiresApproval,
        approvedAt: row.approvedAt?.toISOString() ?? null,
        launchedAt: row.launchedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
    );
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mediaBuyer.approveIntent(user.tenantId!, user.id, id);
  }

  @Post(':id/launch-manual')
  @HttpCode(HttpStatus.OK)
  launchManual(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mediaBuyer.markManualLaunch(user.tenantId!, id);
  }

  @Post('process-pack/:packId')
  @HttpCode(HttpStatus.CREATED)
  processPack(
    @CurrentUser() user: AuthenticatedUser,
    @Param('packId', ParseUUIDPipe) packId: string,
  ) {
    return this.mediaBuyer.processCreativePack(user.tenantId!, packId);
  }
}
