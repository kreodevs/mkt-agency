import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { AssetsModule } from '../assets/assets.module';
import { AssetEntity } from '../assets/infrastructure/typeorm/asset.entity';
import { ProductEntity } from './infrastructure/typeorm/product.entity';
import { ProductMediaKitItemEntity } from './infrastructure/typeorm/product-media-kit-item.entity';
import { ProductController } from './product.controller';
import { ProductLogoService } from './product-logo.service';
import { ProductMediaKitService } from './product-media-kit.service';
import { ProductService } from './product.service';

const MAX_LOGO_FILE_SIZE = 2 * 1024 * 1024;
const MAX_MEDIA_KIT_FILE_SIZE = 52_428_800;

@Module({
  imports: [
    AuthSharedModule,
    AssetsModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: MAX_LOGO_FILE_SIZE },
    }),
    TypeOrmModule.forFeature([ProductEntity, ProductMediaKitItemEntity, AssetEntity]),
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductLogoService, ProductMediaKitService],
  exports: [ProductService, ProductLogoService, ProductMediaKitService],
})
export class ProductModule {}
