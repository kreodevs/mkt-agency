import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SuperadminGuard } from '../../shared/guards/superadmin.guard';
import { ListSecurityEventsQueryDto } from './dto/list-security-events.query.dto';
import { SecurityEventsService } from './security-events.service';

@Controller('security-events')
@UseGuards(SuperadminGuard)
export class SecurityController {
  constructor(private readonly securityEventsService: SecurityEventsService) {}

  @Get()
  list(@Query() query: ListSecurityEventsQueryDto) {
    return this.securityEventsService.list(query);
  }
}
