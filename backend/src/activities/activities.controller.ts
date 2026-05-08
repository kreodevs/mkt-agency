import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActivitiesService } from './activities.service';

@Controller('tenants/:tenantId/activities')
@UseGuards(AuthGuard('jwt'))
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() data: any) {
    return this.activitiesService.create(tenantId, data);
  }

  @Get()
  findAll(@Param('tenantId') tenantId: string) {
    return this.activitiesService.findByTenant(tenantId);
  }

  @Get('lead/:leadId')
  findByLead(@Param('leadId') leadId: string) {
    return this.activitiesService.findByLead(leadId);
  }
}