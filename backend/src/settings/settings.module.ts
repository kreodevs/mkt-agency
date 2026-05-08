import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { ProductSettings } from './entities/product-settings.entity';
import { UploadedFile } from './entities/uploaded-file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductSettings, UploadedFile])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
