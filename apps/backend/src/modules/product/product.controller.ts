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
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import {
  BulkCreateProductsDto,
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from './dto/product.request.dto';
import { UpdateBrandVisualKitDto } from './dto/brand-visual-kit.dto';
import {
  BulkCreateProductsResponseDto,
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from './dto/product.response.dto';
import { ProductLogoResponseDto, SyncProductLogoFromWebsiteDto } from './dto/product-logo.dto';
import {
  AddProductMediaKitItemDto,
  ProductMediaKitItemResponseDto,
  ProductMediaKitListResponseDto,
} from './dto/product-media-kit.dto';
import { ProductLogoService } from './product-logo.service';
import { ProductMediaKitService } from './product-media-kit.service';
import { ProductPublishIntegrationService } from './product-publish-integration.service';
import { ProductAppCaptureService } from './product-app-capture.service';
import { ProductService } from './product.service';
import {
  ProductPublishIntegrationResponseDto,
  UpdateProductPublishIntegrationDto,
} from './dto/product-publish-integration.dto';
import {
  ProductAppCaptureResponseDto,
  ProductAppCaptureRunResponseDto,
  UpdateProductAppCaptureDto,
} from './dto/product-app-capture.dto';
import type { ProductMediaRole } from './domain/product-media-kit.constants';
import { PRODUCT_MEDIA_ROLES } from './domain/product-media-kit.constants';

const MAX_MEDIA_KIT_FILE_SIZE = 52_428_800;

@Controller('products')
@UseGuards(TenantGuard)
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productLogoService: ProductLogoService,
    private readonly productMediaKitService: ProductMediaKitService,
    private readonly productPublishIntegrationService: ProductPublishIntegrationService,
    private readonly productAppCaptureService: ProductAppCaptureService,
  ) {}

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

  @Post(':id/logo/from-website')
  @HttpCode(HttpStatus.OK)
  syncLogoFromWebsite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SyncProductLogoFromWebsiteDto,
  ): Promise<ProductLogoResponseDto> {
    return this.productLogoService.syncFromWebsite(user.tenantId!, id, dto.url);
  }

  @Post(':id/logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ProductLogoResponseDto> {
    return this.productLogoService.uploadLogo(user.tenantId!, id, file);
  }

  @Delete(':id/logo')
  removeLogo(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductLogoResponseDto> {
    return this.productLogoService.removeLogo(user.tenantId!, id);
  }

  @Get(':id/brand-visual-kit')
  getBrandVisualKit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productService.getBrandVisualKit(user.tenantId!, id);
  }

  @Patch(':id/brand-visual-kit')
  updateBrandVisualKit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrandVisualKitDto,
  ) {
    return this.productService.updateBrandVisualKit(user.tenantId!, id, dto);
  }

  @Get(':id/media-kit')
  listMediaKit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductMediaKitListResponseDto> {
    return this.productMediaKitService.listForProduct(user.tenantId!, id);
  }

  @Post(':id/media-kit/upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_MEDIA_KIT_FILE_SIZE } }),
  )
  uploadMediaKit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('role') role: ProductMediaRole,
    @Query('label') label?: string,
  ): Promise<ProductMediaKitItemResponseDto> {
    const resolvedRole = PRODUCT_MEDIA_ROLES.includes(role) ? role : 'other';
    return this.productMediaKitService.uploadToKit(
      user.tenantId!,
      id,
      file,
      resolvedRole,
      label,
    );
  }

  @Post(':id/media-kit/link')
  @HttpCode(HttpStatus.CREATED)
  linkMediaKit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AddProductMediaKitItemDto,
  ): Promise<ProductMediaKitItemResponseDto> {
    return this.productMediaKitService.linkAsset(user.tenantId!, id, body);
  }

  @Delete(':id/media-kit/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMediaKitItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<void> {
    await this.productMediaKitService.removeFromKit(user.tenantId!, id, itemId);
  }

  @Get(':id/publish-integration')
  getPublishIntegration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductPublishIntegrationResponseDto> {
    return this.productPublishIntegrationService.getIntegration(user.tenantId!, id);
  }

  @Patch(':id/publish-integration')
  updatePublishIntegration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProductPublishIntegrationDto,
  ): Promise<ProductPublishIntegrationResponseDto> {
    return this.productPublishIntegrationService.updateIntegration(user.tenantId!, id, body);
  }

  @Get(':id/app-capture')
  getAppCapture(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductAppCaptureResponseDto> {
    return this.productAppCaptureService.getConfig(user.tenantId!, id);
  }

  @Patch(':id/app-capture')
  updateAppCapture(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProductAppCaptureDto,
  ): Promise<ProductAppCaptureResponseDto> {
    return this.productAppCaptureService.updateConfig(user.tenantId!, id, body);
  }

  @Post(':id/app-capture/run')
  @HttpCode(HttpStatus.OK)
  runAppCapture(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductAppCaptureRunResponseDto> {
    return this.productAppCaptureService.runCapture(user.tenantId!, id);
  }
}
