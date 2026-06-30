import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { CommunityManagerService } from './community-manager.service';
import {
  GenerateSocialCopyDto,
  UpdateCommunityManagerPreferencesDto,
} from './dto/community-manager.request.dto';
import {
  CommunityManagerPreferencesResponse,
  CommunityManagerReadinessResponse,
  GenerateResponse,
  SocialCopyBatchResponse,
} from './dto/community-manager.response.dto';

@Controller('community-manager')
@UseGuards(TenantGuard)
export class CommunityManagerController {
  constructor(private readonly cmService: CommunityManagerService) {}

  @Get('batches')
  list(@CurrentUser() user: AuthenticatedUser): Promise<SocialCopyBatchResponse[]> {
    return this.cmService.list(user.tenantId!);
  }

  @Get('preferences')
  getPreferences(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CommunityManagerPreferencesResponse> {
    return this.cmService.getPreferences(user.tenantId!);
  }

  @Put('preferences')
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCommunityManagerPreferencesDto,
  ): Promise<CommunityManagerPreferencesResponse> {
    return this.cmService.updatePreferences(user.tenantId!, dto);
  }

  @Get('readiness')
  getReadiness(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CommunityManagerReadinessResponse> {
    return this.cmService.getReadiness(user.tenantId!);
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  generate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateSocialCopyDto,
  ): Promise<GenerateResponse> {
    return this.cmService.generate(user.tenantId!, user.id, dto);
  }
}