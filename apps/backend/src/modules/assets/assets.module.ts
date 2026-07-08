import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { PackageModule } from '../packages/package.module';
import { MAX_ASSET_FILE_SIZE } from './domain/asset.constants';
import { DeleteAssetHandler } from './commands/delete-asset.handler';
import { AssetFolderController } from './asset-folder.controller';
import { AssetFolderService } from './asset-folder.service';
import { AssetTagController } from './asset-tag.controller';
import { AssetTagService } from './asset-tag.service';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { LocalStorageAdapter } from './infrastructure/adapters/local-storage.adapter';
import { S3StorageAdapter } from './infrastructure/adapters/s3-storage.adapter';
import {
  STORAGE_ADAPTER,
  StorageAdapterPort,
} from './infrastructure/adapters/storage.adapter.port';
import { AssetFolderEntity } from './infrastructure/typeorm/asset-folder.entity';
import { AssetTagAssignmentEntity } from './infrastructure/typeorm/asset-tag-assignment.entity';
import { AssetTagEntity } from './infrastructure/typeorm/asset-tag.entity';
import { AssetEntity } from './infrastructure/typeorm/asset.entity';

@Module({
  imports: [
    AuthSharedModule,
    PackageModule,
    ConfigModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: MAX_ASSET_FILE_SIZE },
    }),
    TypeOrmModule.forFeature([
      AssetEntity,
      AssetFolderEntity,
      AssetTagEntity,
      AssetTagAssignmentEntity,
    ]),
  ],
  controllers: [AssetController, AssetFolderController, AssetTagController],
  providers: [
    AssetService,
    AssetFolderService,
    AssetTagService,
    DeleteAssetHandler,
    S3StorageAdapter,
    LocalStorageAdapter,
    {
      provide: STORAGE_ADAPTER,
      useFactory: (
        config: ConfigService,
        s3: S3StorageAdapter,
        local: LocalStorageAdapter,
      ): StorageAdapterPort => {
        const hasS3 =
          !!config.get<string>('S3_ACCESS_KEY') &&
          !!config.get<string>('S3_SECRET_KEY') &&
          !!config.get<string>('S3_BUCKET');
        return hasS3 ? s3 : local;
      },
      inject: [ConfigService, S3StorageAdapter, LocalStorageAdapter],
    },
  ],
  exports: [AssetService, AssetFolderService],
})
export class AssetsModule {}
