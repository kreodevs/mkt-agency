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
import { GrowthProfileGuard } from '../agency-agents/guards/growth-profile.guard';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { AudienceService } from './audience.service';
import {
  CreateAudienceDto,
  ListAudiencesQueryDto,
  UpdateAudienceDto,
} from './dto/campaign.request.dto';
import {
  AudienceResponseDto,
  PaginatedAudiencesResponseDto,
} from './dto/campaign.response.dto';

@Controller('audiences')
@UseGuards(TenantGuard, GrowthProfileGuard)
export class AudienceController {
  constructor(private readonly audienceService: AudienceService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAudiencesQueryDto,
  ): Promise<PaginatedAudiencesResponseDto> {
    return this.audienceService.list(user.tenantId!, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateAudienceDto,
  ): Promise<AudienceResponseDto> {
    return this.audienceService.create(user.tenantId!, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAudienceDto,
  ): Promise<AudienceResponseDto> {
    return this.audienceService.update(user.tenantId!, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.audienceService.remove(user.tenantId!, id);
  }
}
