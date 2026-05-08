import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Controller('tenants/:tenantId/campaigns')
@UseGuards(AuthGuard('jwt'))
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(tenantId, null as any, dto);
  }

  @Post('product/:productId')
  createForProduct(@Param('tenantId') tenantId: string, @Param('productId') productId: string, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(tenantId, productId, dto);
  }

  @Get()
  findAll(@Param('tenantId') tenantId: string, @Query('productId') productId?: string) {
    return this.campaignsService.findAll(tenantId, productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.campaignsService.update(id, data);
  }

  @Post(':id/keywords')
  addKeyword(@Param('id') id: string, @Body('text') text: string, @Body('cpc') cpc?: number) {
    return this.campaignsService.addKeyword(id, text, cpc);
  }

  @Patch('keywords/:keywordId/pause')
  pauseKeyword(@Param('keywordId') keywordId: string) {
    return this.campaignsService.pauseKeyword(keywordId);
  }
}