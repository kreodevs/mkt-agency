import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AgentTool, ToolContext, ToolDefinition, ToolExecutionResult } from '../../../shared/ai/tools/tool.interface';
import { ProductEntity } from '../../product/infrastructure/typeorm/product.entity';
import { CompanyProfileEntity } from '../../company-profile/infrastructure/typeorm/company-profile.entity';
import { CompanyProfileSectionEntity } from '../../company-profile/infrastructure/typeorm/company-profile-section.entity';
import { ProfileSectionSyncService } from '../../company-profile/services/profile-section-sync.service';
import { Injectable } from '@nestjs/common';
import { resolveVisualBrandKit } from '../domain/visual-brand-kit.util';
import { expandVisualPalette, styleDesignCue } from '../domain/visual-palette-expand.util';

export interface ExpandedPaletteResult {
  primary: string;
  secondary: string;
  accent: string;
  primaryLight: string;
  primaryDark: string;
  secondaryLight: string;
  accentSoft: string;
  glow: string;
  surface: string;
  panel: string;
  gradientStops: string[];
  styleCue: string;
}

@Injectable()
export class BrandPaletteExpandTool implements AgentTool {
  readonly definition: ToolDefinition = {
    name: 'expand_brand_palette',
    description: 'Expande la paleta de marca del producto en tonos derivados: primaryLight, primaryDark, glow, gradientStops, surface, panel. Útil para describir degradados, brillos y variantes en prompts visuales.',
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
        return { success: false, result: null, error: 'No productId provided' };
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
      const palette = expandVisualPalette(kit);

      const result: ExpandedPaletteResult = {
        primary: palette.primary,
        secondary: palette.secondary,
        accent: palette.accent,
        primaryLight: palette.primaryLight,
        primaryDark: palette.primaryDark,
        secondaryLight: palette.secondaryLight,
        accentSoft: palette.accentSoft,
        glow: palette.glow,
        surface: palette.surface,
        panel: palette.panel,
        gradientStops: palette.gradientStops,
        styleCue: styleDesignCue(kit.style),
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
