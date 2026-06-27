import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { CompetitorIntelService } from './competitor-intel.service';

@Controller('agents/competitor-intel')
@UseGuards(TenantGuard)
export class CompetitorIntelController {
  constructor(private readonly competitorIntel: CompetitorIntelService) {}

  @Get()
  listAnalyses(@CurrentUser() user: AuthenticatedUser) {
    return this.competitorIntel.listAnalyses(user.tenantId!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  triggerAnalysis(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { competitors?: string },
  ) {
    return this.competitorIntel.triggerAnalysis(user.tenantId!, body.competitors);
  }

  @Get(':id')
  getAnalysis(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.competitorIntel.getAnalysis(user.tenantId!, id);
  }
}