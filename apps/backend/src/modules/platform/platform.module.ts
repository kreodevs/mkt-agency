import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformIntegrationEntity } from './infrastructure/typeorm/platform-integration.entity';
import { PlatformIntegrationService } from './services/platform-integration.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformIntegrationEntity])],
  providers: [PlatformIntegrationService],
  exports: [PlatformIntegrationService],
})
export class PlatformModule {}
