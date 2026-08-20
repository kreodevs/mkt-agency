import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { AssetsModule } from '../assets/assets.module';
import { AssetEntity } from '../assets/infrastructure/typeorm/asset.entity';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ProductEntity } from './infrastructure/typeorm/product.entity';
import { ProductMediaKitItemEntity } from './infrastructure/typeorm/product-media-kit-item.entity';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { ContentVersionEntity } from '../content/infrastructure/typeorm/content-version.entity';
import { ProductController } from './product.controller';
import { ProductLogoService } from './product-logo.service';
import { ProductMediaKitService } from './product-media-kit.service';
import { ProductPublishIntegrationService } from './product-publish-integration.service';
import { ProductPublishWebhookController } from './product-publish-webhook.controller';
import { ProductPublishWebhookService } from './product-publish-webhook.service';
import { ProductAppCaptureService } from './product-app-capture.service';
import { AppScreenshotCaptureService } from './app-screenshot-capture.service';
import { ProductService } from './product.service';

const MAX_LOGO_FILE_SIZE = 2 * 1024 * 1024;
const MAX_MEDIA_KIT_FILE_SIZE = 52_428_800;

@Module({
  imports: [
    AuthSharedModule,
    AssetsModule,
    KnowledgeModule,
    ConfigModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: MAX_LOGO_FILE_SIZE },
    }),
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductMediaKitItemEntity,
      AssetEntity,
      ContentEntity,
      ContentVersionEntity,
    ]),
  ],
  controllers: [ProductController, ProductPublishWebhookController],
  providers: [
    ProductService,
    ProductLogoService,
    ProductMediaKitService,
    ProductPublishIntegrationService,
    ProductPublishWebhookService,
    AppScreenshotCaptureService,
    ProductAppCaptureService,
  ],
  exports: [
    ProductService,
    ProductLogoService,
    ProductMediaKitService,
    ProductPublishIntegrationService,
    ProductPublishWebhookService,
    ProductAppCaptureService,
  ],
})
export class ProductModule {}
