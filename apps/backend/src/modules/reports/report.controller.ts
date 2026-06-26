import {
  Body,
  Controller,
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
import { CreateReportDto, ListReportsQueryDto } from './dto/report.request.dto';
import {
  CreateReportResponseDto,
  PaginatedReportsResponseDto,
  ReportResponseDto,
} from './dto/report.response.dto';
import { ReportService } from './report.service';

@Controller('reports')
@UseGuards(TenantGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReportDto,
  ): Promise<CreateReportResponseDto> {
    return this.reportService.create(user.tenantId!, dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListReportsQueryDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedReportsResponseDto> {
    return this.reportService.list(
      user.tenantId!,
      query,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReportResponseDto> {
    return this.reportService.findOne(user.tenantId!, id);
  }
}
