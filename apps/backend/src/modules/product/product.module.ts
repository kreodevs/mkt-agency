import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmModule } from '../../shared/ai/llm.module';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { AgentsModule } from '../agents/agents.module';
import { CommunityManagerModule } from '../community-manager/community-manager.module';
import { CompetitorsModule } from '../competitors/competitors.module';
import { ProductEntity } from './infrastructure/typeorm/product.entity';
import { ProductController } from './product.controller';
import { ProductOnboardingService } from './product-onboarding.service';
import { ProductService } from './product.service';

@Module({
  imports: [
    AuthSharedModule,
    LlmModule,
    forwardRef(() => AgentsModule),
    forwardRef(() => CompetitorsModule),
    forwardRef(() => CommunityManagerModule),
    TypeOrmModule.forFeature([ProductEntity]),
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductOnboardingService],
  exports: [ProductService],
})
export class ProductModule {}
