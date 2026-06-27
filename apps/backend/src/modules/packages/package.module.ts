import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { UserEntity } from '../../shared/infrastructure/typeorm/user.entity';
import { AssetEntity } from '../assets/infrastructure/typeorm/asset.entity';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { TenantEntity } from '../tenant/infrastructure/typeorm/tenant.entity';
import { PackageController } from './package.controller';
import { PackageService } from './package.service';
import { PackageEntity } from './infrastructure/typeorm/package.entity';
import { TenantLimitsService } from './services/tenant-limits.service';

@Module({
  imports: [
    AuthSharedModule,
    TypeOrmModule.forFeature([
      PackageEntity,
      TenantEntity,
      UserEntity,
      AssetEntity,
      CampaignEntity,
    ]),
  ],
  controllers: [PackageController],
  providers: [PackageService, TenantLimitsService],
  exports: [PackageService, TenantLimitsService],
})
export class PackageModule {}
