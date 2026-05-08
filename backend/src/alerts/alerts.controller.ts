import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AlertsService } from './alerts.service';

@Controller('tenants/:tenantId/alerts')
@UseGuards(AuthGuard('jwt'))
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() data: any) {
    return this.alertsService.create(tenantId, data);
  }

  @Get()
  findAll(@Param('tenantId') tenantId: string) {
    return this.alertsService.findByTenant(tenantId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.alertsService.markRead(id);
  }
}