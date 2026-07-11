import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { CompanyProfileSectionEntity } from '../company-profile/infrastructure/typeorm/company-profile-section.entity';
import {
  ProfileSectionSyncService,
  ResolvedProfileValues,
} from '../company-profile/services/profile-section-sync.service';
import { CompetitorIntelService } from '../agents/competitor-intel.service';
import { CompetitorService } from '../competitors/competitor.service';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import {
  mergeBrandAndProductBrief,
  toProductContext,
} from '../product/domain/product-context.util';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import { ProductService } from '../product/product.service';
import { ProductMediaKitService } from '../product/product-media-kit.service';
import { AssetFolderService } from '../assets/asset-folder.service';
import { CmCharacterService } from './cm-character.service';
import { type CmCharacterLlmOption } from './domain/cm-character.constants';
import { type LibraryFolderSummary } from '../assets/asset-folder.service';
import { type MediaKitLlmItem } from '../product/product-media-kit.service';
import { buildCompetitorIntelBriefForSocialCopy } from './domain/competitor-intel-brief.util';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { type CmPlatform } from './domain/cm-platforms.constants';

export interface GenerationContext {
  resolvedProfile: ResolvedProfileValues | null;
  productContext: ReturnType<typeof toProductContext> | null;
  brandBrief: Record<string, unknown> | null;
  competitorIntelBrief: Record<string, unknown> | null;
  effectiveProductId: string | undefined;
  kit: Awaited<ReturnType<ProductMediaKitService['listEntitiesForProduct']>>;
  cmCharacters: CmCharacterLlmOption[];
  cmCharacterReady: boolean;
  libraryFolders: LibraryFolderSummary[];
  mediaKitContext: MediaKitLlmItem[];
}

@Injectable()
export class GenerationContextFacade {
  constructor(
    @InjectRepository(CompanyProfileEntity)
    private readonly profiles: Repository<CompanyProfileEntity>,
    @InjectRepository(CompanyProfileSectionEntity)
    private readonly profileSections: Repository<CompanyProfileSectionEntity>,
    @InjectRepository(ProductEntity)
    private readonly productEntities: Repository<ProductEntity>,
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
    @InjectRepository(ContentEntity)
    private readonly contents: Repository<ContentEntity>,
    private readonly profileSectionSync: ProfileSectionSyncService,
    private readonly productService: ProductService,
    private readonly competitorIntel: CompetitorIntelService,
    private readonly competitorService: CompetitorService,
    private readonly mediaKitService: ProductMediaKitService,
    private readonly assetFolderService: AssetFolderService,
    private readonly cmCharacter: CmCharacterService,
  ) {}

  async buildGenerationContext(
    tenantId: string,
    dto: { productId?: string; campaignId?: string },
  ): Promise<GenerationContext> {
    const resolvedProfile = await this.loadResolvedProfile(tenantId);
    const productContext = await this.resolveProductForGeneration(
      tenantId, dto.productId, dto.campaignId,
    );
    const brandBrief = mergeBrandAndProductBrief(resolvedProfile, productContext);
    const competitorIntelBrief = await this.resolveCompetitorIntelBrief(tenantId);
    const effectiveProductId = productContext?.id ?? dto.productId;
    const kit = effectiveProductId
      ? await this.mediaKitService.listEntitiesForProduct(tenantId, effectiveProductId)
      : [];
    const cmCharacters = effectiveProductId
      ? await this.cmCharacter.listReadyForLlm(tenantId, effectiveProductId)
      : [];
    const cmCharacterReady = effectiveProductId
      ? await this.cmCharacter.hasAnyReadyCharacter(tenantId, effectiveProductId)
      : false;
    const libraryFolders = await this.assetFolderService.buildLibrarySummaryForLlm(tenantId);
    const mediaKitContext = kit.length
      ? await this.mediaKitService.buildMediaKitContextForLlm(tenantId, kit)
      : [];

    return {
      resolvedProfile,
      productContext,
      brandBrief,
      competitorIntelBrief,
      effectiveProductId,
      kit,
      cmCharacters,
      cmCharacterReady,
      libraryFolders,
      mediaKitContext,
    };
  }

  async buildRegenerationContext(
    tenantId: string,
    content: { productId?: string | null; campaignId?: string | null; platform?: string | null },
    normalizePlatforms: (value?: string[] | undefined) => string[],
  ): Promise<GenerationContext & { platform: CmPlatform }> {
    const platform = normalizePlatforms(
      content.platform ? [content.platform] : undefined,
    )[0] as CmPlatform;
    const ctx = await this.buildGenerationContext(tenantId, {
      productId: content.productId ?? undefined,
      campaignId: content.campaignId ?? undefined,
    });
    return { ...ctx, platform };
  }

  private async loadResolvedProfile(tenantId: string): Promise<ResolvedProfileValues | null> {
    const profile = await this.profiles.findOne({ where: { tenantId } });
    if (!profile) {
      return null;
    }
    const sections = await this.profileSections.find({ where: { profileId: profile.id } });
    return this.profileSectionSync.resolveProfileValues(profile, sections);
  }

  private async resolveProductForGeneration(
    tenantId: string,
    productId?: string,
    campaignId?: string,
  ): Promise<ReturnType<typeof toProductContext> | null> {
    if (productId) {
      const product = await this.productService.findOwnedEntity(tenantId, productId);
      return toProductContext(product);
    }

    if (campaignId) {
      const product = await this.resolveProductFromCampaign(tenantId, campaignId);
      if (product) return product;
    }

    const primary = await this.productService.findPrimary(tenantId);
    return primary ? toProductContext(primary) : null;
  }

  private async resolveProductFromCampaign(
    tenantId: string,
    campaignId: string,
  ): Promise<ReturnType<typeof toProductContext> | null> {
    const campaign = await this.campaigns.findOne({ where: { id: campaignId, tenantId } });
    if (!campaign?.productId) return null;
    const product = await this.productEntities.findOne({
      where: { id: campaign.productId, tenantId },
    });
    return product ? toProductContext(product) : null;
  }

  private async resolveCompetitorIntelBrief(
    tenantId: string,
  ): Promise<Record<string, unknown> | null> {
    const [latestAnalysis, competitorList] = await Promise.all([
      this.competitorIntel.getLatestCompletedAnalysis(tenantId),
      this.competitorService.list(tenantId),
    ]);

    const trackedCompetitorNames = competitorList.items.map((item) => item.name);
    const brief = buildCompetitorIntelBriefForSocialCopy({
      analysisId: latestAnalysis?.id ?? 'none',
      generatedAt: latestAnalysis?.updatedAt.toISOString() ?? new Date().toISOString(),
      analysis: latestAnalysis?.analysis ?? null,
      trackedCompetitorNames,
    });

    return brief as unknown as Record<string, unknown> | null;
  }

  async refreshCampaignLinkedContent(tenantId: string, campaignId: string): Promise<void> {
    const campaign = await this.campaigns.findOne({ where: { id: campaignId, tenantId } });
    if (!campaign) {
      return;
    }

    const linkedContentCount = await this.contents.count({
      where: { tenantId, campaignId },
    });
    const strategy = { ...(campaign.strategy ?? {}) };
    strategy.linkedContentCount = linkedContentCount;
    if (linkedContentCount > 0) {
      strategy.timeline = `${linkedContentCount} post${linkedContentCount === 1 ? '' : 's'} programado${linkedContentCount === 1 ? '' : 's'} — revisa en Calendario → Aprueba → Copia y publica en cada red`;
    }
    campaign.strategy = strategy;
    await this.campaigns.save(campaign);
  }
}
