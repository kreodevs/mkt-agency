import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('tenants/:tenantId/products')
@UseGuards(AuthGuard('jwt'))
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(tenantId, dto);
  }

  @Get()
  findAll(@Param('tenantId') tenantId: string) {
    return this.productsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.productsService.update(id, data);
  }
}