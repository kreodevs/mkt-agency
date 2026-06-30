import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmModule } from '../../shared/ai/llm.module';
import { AgentsModule } from '../agents/agents.module';
import { CommunityManagerModule } from '../community-manager/community-manager.module';
import { PublicationInboxModule } from '../publication-inbox/publication-inbox.module';
import { CompetitorsModule } from '../competitors/competitors.module';
import { ProductEntity } from './infrastructure/typeorm/product.entity';
import { ProductOnboardingController } from './product-onboarding.controller';
import { ProductOnboardingService } from './product-onboarding.service';
import { ProductModule } from './product.module';

@Module({
  imports: [
    ProductModule,
    LlmModule,
    AgentsModule,
    CompetitorsModule,
    CommunityManagerModule,
    PublicationInboxModule,
    TypeOrmModule.forFeature([ProductEntity]),
  ],
  controllers: [ProductOnboardingController],
  providers: [ProductOnboardingService],
})
export class ProductOnboardingModule {}
