import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import {
  BulkCreateProductsDto,
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from './dto/product.request.dto';
import {
  BulkCreateProductsResponseDto,
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from './dto/product.response.dto';
import { ProductService } from './product.service';

@Controller('products')
@UseGuards(TenantGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListProductsQueryDto,
  ): Promise<PaginatedProductsResponseDto> {
    return this.productService.list(user.tenantId!, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productService.create(user.tenantId!, dto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  bulkCreate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkCreateProductsDto,
  ): Promise<BulkCreateProductsResponseDto> {
    return this.productService.bulkCreateFromNames(user.tenantId!, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductResponseDto> {
    return this.productService.findOne(user.tenantId!, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productService.update(user.tenantId!, id, dto);
  }

  @Post(':id/archive')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductResponseDto> {
    return this.productService.archive(user.tenantId!, id);
  }
}
