import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { Tenant } from './entities/tenant.entity';
import { Product } from '../products/entities/product.entity';
import { TenantUser } from '../users/entities/tenant-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Product, TenantUser])],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}