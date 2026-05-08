import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadStageDto } from './dto/create-lead.dto';

@Controller('tenants/:tenantId/leads')
@UseGuards(AuthGuard('jwt'))
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(tenantId, null as any, dto);
  }

  @Post('product/:productId')
  createForProduct(@Param('tenantId') tenantId: string, @Param('productId') productId: string, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(tenantId, productId, dto);
  }

  @Get()
  findAll(@Param('tenantId') tenantId: string, @Query('productId') productId?: string) {
    return this.leadsService.findAll(tenantId, productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id/stage')
  updateStage(@Param('id') id: string, @Body() dto: UpdateLeadStageDto) {
    return this.leadsService.updateStage(id, dto);
  }

  @Patch(':id/score')
  updateScore(@Param('id') id: string, @Body('score') score: number) {
    return this.leadsService.updateScore(id, score);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.leadsService.update(id, data);
  }
}