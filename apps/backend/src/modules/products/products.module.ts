import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { AgentsModule } from '../agents/agents.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductEntity } from './infrastructure/typeorm/product.entity';

@Module({
  imports: [
    AuthSharedModule,
    AgentsModule,
    TypeOrmModule.forFeature([ProductEntity]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}