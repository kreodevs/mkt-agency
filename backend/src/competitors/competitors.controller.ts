import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompetitorsService } from './competitors.service';
import { CreateCompetitorDto } from './dto/create-competitor.dto';
import { CreateMentionDto } from './dto/create-mention.dto';

@Controller('tenants/:tenantId/competitors')
@UseGuards(AuthGuard('jwt'))
export class CompetitorsController {
  constructor(private readonly competitorsService: CompetitorsService) {}

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateCompetitorDto) {
    return this.competitorsService.create(tenantId, null as any, dto);
  }

  @Post('product/:productId')
  createForProduct(@Param('tenantId') tenantId: string, @Param('productId') productId: string, @Body() dto: CreateCompetitorDto) {
    return this.competitorsService.create(tenantId, productId, dto);
  }

  @Get()
  findAll(@Param('tenantId') tenantId: string, @Query('productId') productId?: string) {
    return this.competitorsService.findAll(tenantId, productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.competitorsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.competitorsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.competitorsService.remove(id);
  }

  @Post(':id/mentions')
  createMention(@Param('id') id: string, @Body() dto: CreateMentionDto) {
    return this.competitorsService.createMention(id, dto);
  }

  @Get(':id/mentions')
  getMentions(@Param('id') id: string) {
    return this.competitorsService.getMentions(id);
  }
}
