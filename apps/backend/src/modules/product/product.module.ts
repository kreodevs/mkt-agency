import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { AssetsModule } from '../assets/assets.module';
import { ProductEntity } from './infrastructure/typeorm/product.entity';
import { ProductController } from './product.controller';
import { ProductLogoService } from './product-logo.service';
import { ProductService } from './product.service';

const MAX_LOGO_FILE_SIZE = 2 * 1024 * 1024;

@Module({
  imports: [
    AuthSharedModule,
    AssetsModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: MAX_LOGO_FILE_SIZE },
    }),
    TypeOrmModule.forFeature([ProductEntity]),
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductLogoService],
  exports: [ProductService, ProductLogoService],
})
export class ProductModule {}
