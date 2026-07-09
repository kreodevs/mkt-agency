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
import { CampaignTemplateService } from './campaign-template.service';
import {
  CreateCampaignTemplateDto,
  ListCampaignTemplatesQueryDto,
  UpdateCampaignTemplateDto,
} from './dto/campaign.request.dto';
import {
  CampaignTemplateResponseDto,
  PaginatedCampaignTemplatesResponseDto,
} from './dto/campaign.response.dto';

@Controller('campaign-templates')
@UseGuards(TenantGuard, GrowthProfileGuard)
export class CampaignTemplateController {
  constructor(private readonly templateService: CampaignTemplateService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCampaignTemplatesQueryDto,
  ): Promise<PaginatedCampaignTemplatesResponseDto> {
    return this.templateService.list(user.tenantId!, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateCampaignTemplateDto,
  ): Promise<CampaignTemplateResponseDto> {
    return this.templateService.create(user.tenantId!, body);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CampaignTemplateResponseDto> {
    return this.templateService.findOne(user.tenantId!, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCampaignTemplateDto,
  ): Promise<CampaignTemplateResponseDto> {
    return this.templateService.update(user.tenantId!, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.templateService.remove(user.tenantId!, id);
  }
}
