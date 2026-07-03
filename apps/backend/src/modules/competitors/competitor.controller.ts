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
import { CreateCompetitorDto, DiscoverCompetitorsDto, BulkCreateCompetitorsDto, ListMentionsQueryDto } from './dto/competitor.request.dto';
import {
  BulkCreateCompetitorsResponseDto,
  CompetitorListResponseDto,
  CompetitorResponseDto,
  DiscoverCompetitorsJobStartedDto,
  DiscoverCompetitorsJobStatusDto,
  PaginatedMentionsResponseDto,
} from './dto/competitor.response.dto';
import { CompetitorDiscoveryWorkerService } from './workers/competitor-discovery.worker';

@Controller('competitors')
@UseGuards(TenantGuard)
export class CompetitorController {
  constructor(
    private readonly competitorService: CompetitorService,
    private readonly discoveryWorker: CompetitorDiscoveryWorkerService,
  ) {}

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

  @Post('discover')
  @HttpCode(HttpStatus.ACCEPTED)
  discover(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DiscoverCompetitorsDto,
  ): Promise<DiscoverCompetitorsJobStartedDto> {
    return this.discoveryWorker.enqueue(user.tenantId!, dto).then((jobId) => ({
      jobId,
      status: 'processing' as const,
    }));
  }

  @Get('discover/jobs/:jobId')
  getDiscoverJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId') jobId: string,
  ): Promise<DiscoverCompetitorsJobStatusDto> {
    return this.discoveryWorker.getStatus(jobId, user.tenantId!);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  bulkCreate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkCreateCompetitorsDto,
  ): Promise<BulkCreateCompetitorsResponseDto> {
    return this.competitorService.bulkCreate(user.tenantId!, dto);
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
