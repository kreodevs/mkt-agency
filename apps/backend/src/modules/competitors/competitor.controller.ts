import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { CompetitorService } from './competitor.service';
import { CreateCompetitorDto, ListMentionsQueryDto } from './dto/competitor.request.dto';
import {
  CompetitorListResponseDto,
  CompetitorResponseDto,
  PaginatedMentionsResponseDto,
} from './dto/competitor.response.dto';

@Controller('competitors')
@UseGuards(TenantGuard)
export class CompetitorController {
  constructor(private readonly competitorService: CompetitorService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<CompetitorListResponseDto> {
    return this.competitorService.list(user.tenantId!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCompetitorDto,
  ): Promise<CompetitorResponseDto> {
    return this.competitorService.create(user.tenantId!, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.competitorService.remove(user.tenantId!, id);
  }

  @Get(':id/mentions')
  listMentions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListMentionsQueryDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedMentionsResponseDto> {
    return this.competitorService.listMentions(
      user.tenantId!,
      id,
      query,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
