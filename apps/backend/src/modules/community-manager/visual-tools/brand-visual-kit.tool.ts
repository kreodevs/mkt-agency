import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AgentTool, ToolContext, ToolDefinition, ToolExecutionResult } from '../../../shared/ai/tools/tool.interface';
import { ProductEntity } from '../../product/infrastructure/typeorm/product.entity';
import { CompanyProfileEntity } from '../../company-profile/infrastructure/typeorm/company-profile.entity';
import { CompanyProfileSectionEntity } from '../../company-profile/infrastructure/typeorm/company-profile-section.entity';
import { ProfileSectionSyncService } from '../../company-profile/services/profile-section-sync.service';
import { Injectable } from '@nestjs/common';
import { getProductBrandVisualKit } from '../../product/domain/brand-visual-kit.metadata.util';
import { resolveVisualBrandKit } from '../domain/visual-brand-kit.util';

export interface BrandVisualKitResult {
  productName: string;
  style: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily?: string;
  hasLogo: boolean;
}

@Injectable()
export class BrandVisualKitTool implements AgentTool {
  readonly definition: ToolDefinition = {
    name: 'get_brand_visual_kit',
    description: 'Obtiene el kit visual de marca del producto activo: colores, estilo visual, tipografía y si tiene logo. Útil para alinear el estilo del arte con la identidad real de la marca.',
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'ID del producto. Si se omite, usa el producto activo del tenant.',
        },
      },
    },
  };

  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @InjectRepository(CompanyProfileEntity)
    private readonly profiles: Repository<CompanyProfileEntity>,
    @InjectRepository(CompanyProfileSectionEntity)
    private readonly profileSections: Repository<CompanyProfileSectionEntity>,
    private readonly profileSync: ProfileSectionSyncService,
  ) {}

  async execute(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolExecutionResult> {
    try {
      const productId = (input.productId as string) ?? ctx.productId;
      if (!productId) {
        return { success: false, result: null, error: 'No productId provided and no active product found' };
      }

      const product = await this.products.findOne({ where: { id: productId, tenantId: ctx.tenantId } });
      if (!product) {
        return { success: false, result: null, error: 'Product not found' };
      }

      const profile = await this.profiles.findOne({ where: { tenantId: ctx.tenantId } });
      let resolvedProfile = null;
      if (profile) {
        const sections = await this.profileSections.find({ where: { profileId: profile.id } });
        resolvedProfile = await this.profileSync.resolveProfileValues(profile, sections);
      }

      const kit = resolveVisualBrandKit(product, resolvedProfile);

      const result: BrandVisualKitResult = {
        productName: kit.productName,
        style: kit.style,
        primaryColor: kit.primaryColor,
        secondaryColor: kit.secondaryColor,
        accentColor: kit.accentColor,
        fontFamily: kit.fontFamily,
        hasLogo: Boolean(kit.logoAssetId),
      };

      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
