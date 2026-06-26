import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SuperadminGuard } from '../../shared/guards/superadmin.guard';
import { AuditService } from './audit.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs.query.dto';
import { PaginatedAuditLogsResponseDto } from './dto/audit-log.response.dto';

@Controller('audit-logs')
@UseGuards(SuperadminGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Query() query: ListAuditLogsQueryDto): Promise<PaginatedAuditLogsResponseDto> {
    return this.auditService.list(query);
  }
}
