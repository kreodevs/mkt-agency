import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SeoRankingsService } from './seo-rankings.service';
import { CreateRankingDto } from './dto/create-ranking.dto';

@Controller('tenants/:tenantId/seo-rankings')
@UseGuards(AuthGuard('jwt'))
export class SeoRankingsController {
  constructor(private readonly seoRankingsService: SeoRankingsService) {}

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateRankingDto) {
    return this.seoRankingsService.create(tenantId, dto);
  }

  @Get()
  findAll(
    @Param('tenantId') tenantId: string,
    @Query('productId') productId?: string,
    @Query('keyword') keyword?: string,
    @Query('city') city?: string,
    @Query('competitorId') competitorId?: string,
  ) {
    return this.seoRankingsService.findAll(tenantId, { productId, keyword, city, competitorId });
  }

  @Get('latest')
  getLatest(@Param('tenantId') tenantId: string, @Query('productId') productId?: string) {
    return this.seoRankingsService.getLatest(tenantId, productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.seoRankingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<CreateRankingDto>) {
    return this.seoRankingsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.seoRankingsService.remove(id);
  }
}
