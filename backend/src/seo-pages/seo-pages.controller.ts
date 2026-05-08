import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { SeoPagesService } from './seo-pages.service';
import { CreateSeoPageDto } from './dto/create-seo-page.dto';
import { UpdateSeoPageDto } from './dto/update-seo-page.dto';

@Controller('tenants/:tenantId/seo-pages')
export class SeoPagesController {
  constructor(private readonly seoPagesService: SeoPagesService) {}

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateSeoPageDto) {
    return this.seoPagesService.create(tenantId, null as any, dto);
  }

  @Post('product/:productId')
  createForProduct(
    @Param('tenantId') tenantId: string,
    @Param('productId') productId: string,
    @Body() dto: CreateSeoPageDto,
  ) {
    return this.seoPagesService.create(tenantId, productId, dto);
  }

  @Get()
  findAll(
    @Param('tenantId') tenantId: string,
    @Query('city') city?: string,
    @Query('productId') productId?: string,
  ) {
    return this.seoPagesService.findAll(tenantId, city, productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.seoPagesService.findOne(id);
  }

  @Get(':slug/by-slug')
  findBySlug(
    @Param('tenantId') tenantId: string,
    @Param('slug') slug: string,
    @Query('productId') productId?: string,
  ) {
    return this.seoPagesService.findBySlug(tenantId, slug, productId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSeoPageDto) {
    return this.seoPagesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.seoPagesService.remove(id);
  }
}
