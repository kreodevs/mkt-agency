import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TrialsService } from './trials.service';

@Controller()
export class TrialsController {
  constructor(private readonly trialsService: TrialsService) {}

  @Get('tenants/:tenantId/trials')
  @UseGuards(AuthGuard('jwt'))
  findAll(@Param('tenantId') tenantId: string) {
    return this.trialsService.findAll(tenantId);
  }

  @Get('tenants/:tenantId/trials/:id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id') id: string) {
    return this.trialsService.findOne(id);
  }

  @Get('tenants/:tenantId/trials/stats')
  @UseGuards(AuthGuard('jwt'))
  stats(@Param('tenantId') tenantId: string) {
    return this.trialsService.getStats(tenantId);
  }

  @Get('tenants/:tenantId/trials/pending-nurturing')
  @UseGuards(AuthGuard('jwt'))
  pendingNurturing(@Param('tenantId') tenantId: string) {
    return this.trialsService.getPendingNurturing();
  }
}