import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolRegistryService } from '../../../shared/ai/tools/tool-registry.service';
import { ProductModule } from '../../product/product.module';
import { CompanyProfileModule } from '../../company-profile/company-profile.module';
import { forwardRef } from '@nestjs/common';
import { AgentsModule } from '../../agents/agents.module';
import { ProductEntity } from '../../product/infrastructure/typeorm/product.entity';
import { CompanyProfileEntity } from '../../company-profile/infrastructure/typeorm/company-profile.entity';
import { CompanyProfileSectionEntity } from '../../company-profile/infrastructure/typeorm/company-profile-section.entity';
import { CommunityManagerBatchEntity } from '../infrastructure/typeorm/community-manager-batch.entity';
import { AgentImageGenerationEntity } from '../../agents/domain/agent-image-generation.entity';
import { BrandVisualKitTool } from './brand-visual-kit.tool';
import { ArtRecipeQueryTool } from './art-recipe-query.tool';
import { BrandPaletteExpandTool } from './brand-palette-expand.tool';
import { RecentRecipeIdsTool } from './recent-recipe-ids.tool';
import { CompetitorVisualAngleTool } from './competitor-visual-angle.tool';
import { DeviceFrameAvailabilityTool } from './device-frame-availability.tool';
import { VisualToolContextFactory } from './visual-tool-context.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      CompanyProfileEntity,
      CompanyProfileSectionEntity,
      CommunityManagerBatchEntity,
      AgentImageGenerationEntity,
    ]),
    ProductModule,
    CompanyProfileModule,
    forwardRef(() => AgentsModule),
  ],
  providers: [
    ToolRegistryService,
    BrandVisualKitTool,
    ArtRecipeQueryTool,
    BrandPaletteExpandTool,
    RecentRecipeIdsTool,
    CompetitorVisualAngleTool,
    DeviceFrameAvailabilityTool,
    VisualToolContextFactory,
  ],
  exports: [
    ToolRegistryService,
    BrandVisualKitTool,
    ArtRecipeQueryTool,
    BrandPaletteExpandTool,
    RecentRecipeIdsTool,
    CompetitorVisualAngleTool,
    DeviceFrameAvailabilityTool,
    VisualToolContextFactory,
  ],
})
export class VisualToolsModule {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly brandKit: BrandVisualKitTool,
    private readonly artRecipe: ArtRecipeQueryTool,
    private readonly palette: BrandPaletteExpandTool,
    private readonly recent: RecentRecipeIdsTool,
    private readonly competitor: CompetitorVisualAngleTool,
    private readonly device: DeviceFrameAvailabilityTool,
  ) {
    this.registry.register(this.brandKit);
    this.registry.register(this.artRecipe);
    this.registry.register(this.palette);
    this.registry.register(this.recent);
    this.registry.register(this.competitor);
    this.registry.register(this.device);
  }
}
