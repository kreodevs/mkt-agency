import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { CalendarService } from './calendar.service';
import { GetCalendarQueryDto } from './dto/calendar.request.dto';
import {
  CalendarDayDetailResponseDto,
  CalendarMonthResponseDto,
} from './dto/calendar.response.dto';

@Controller('calendar')
@UseGuards(TenantGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  getMonth(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetCalendarQueryDto,
  ): Promise<CalendarMonthResponseDto> {
    return this.calendarService.getMonth(user.tenantId!, query.month, query.year, query.productId);
  }

  @Get(':date')
  getDayDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date') date: string,
    @Query('productId') productId?: string,
  ): Promise<CalendarDayDetailResponseDto> {
    return this.calendarService.getDayDetail(user.tenantId!, date, productId);
  }
}
