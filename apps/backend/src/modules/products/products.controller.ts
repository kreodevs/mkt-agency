import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  CreateProductFromAnalysisDto,
  UpdateProductDto,
  AutoCreateProductsDto,
} from './dto/product.request.dto';
import {
  ProductListResponseDto,
  ProductResponseDto,
} from './dto/product.response.dto';

@Controller('products')
@UseGuards(TenantGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<ProductListResponseDto> {
    return this.productsService.list(user.tenantId!);
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.get(user.tenantId!, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.create(user.tenantId!, dto);
  }

  @Post('auto-create')
  @HttpCode(HttpStatus.CREATED)
  autoCreate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AutoCreateProductsDto,
  ): Promise<ProductListResponseDto> {
    return this.productsService.autoCreate(user.tenantId!, dto);
  }

  @Post('from-analysis')
  @HttpCode(HttpStatus.CREATED)
  fromAnalysis(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductFromAnalysisDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.fromAnalysis(user.tenantId!, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(user.tenantId!, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.productsService.remove(user.tenantId!, id);
  }
}