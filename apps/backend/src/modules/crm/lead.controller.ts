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
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import {
  ChangeLeadStageDto,
  ListLeadsQueryDto,
  UpdateLeadDto,
} from './dto/lead.request.dto';
import {
  LeadInteractionsListResponseDto,
  LeadResponseDto,
  PaginatedLeadsResponseDto,
} from './dto/lead.response.dto';
import { LeadService } from './lead.service';

@Controller('leads')
@UseGuards(TenantGuard)
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListLeadsQueryDto,
  ): Promise<PaginatedLeadsResponseDto> {
    return this.leadService.list(user.tenantId!, query);
  }

  @Get(':id/interactions')
  interactions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LeadInteractionsListResponseDto> {
    return this.leadService.listInteractions(user.tenantId!, id);
  }

  @Patch(':id/stage')
  changeStage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ChangeLeadStageDto,
  ): Promise<LeadResponseDto> {
    return this.leadService.changeStage(user.tenantId!, id, body);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LeadResponseDto> {
    return this.leadService.findOne(user.tenantId!, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateLeadDto,
  ): Promise<LeadResponseDto> {
    return this.leadService.update(user.tenantId!, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.leadService.remove(user.tenantId!, id);
  }
}
