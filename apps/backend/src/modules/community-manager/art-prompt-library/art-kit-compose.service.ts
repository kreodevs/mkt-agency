import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { runWithLlmUsageContext } from '../../../shared/ai/llm-usage.context';
import {
  resolveImageSizeForPlatform,
  resolveImageStyleForPlatform,
} from '../../../shared/social/image-destination-formats.util';
import { AssetService } from '../../assets/asset.service';
import { ImageGenerationService } from '../../agents/image-generation.service';
import { ImageBrandingService } from '../../agents/image-branding.service';
import { AgentImageGenerationEntity } from '../../agents/domain/agent-image-generation.entity';
import { ContentService } from '../../content/content.service';
import {
  normalizeContentVisualFormat,
  visualFormatToFrameCount,
} from '../../content/domain/content-visual-format.util';
import type { ResolvedProfileValues } from '../../company-profile/services/profile-section-sync.service';
import { ProductService } from '../../product/product.service';
import { ProductMediaKitService } from '../../product/product-media-kit.service';
import type { ProductMediaKitItemEntity } from '../../product/infrastructure/typeorm/product-media-kit-item.entity';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import { enrichVisualDescriptionForAi } from '../domain/visual-prompt-enrichment.util';
import {
  persistDerivedBrandVisualKit,
  resolveVisualBrandKit,
} from '../domain/visual-brand-kit.util';
import { ProductEntity } from '../../product/infrastructure/typeorm/product.entity';
import {
  ArtPromptSelectorService,
  type ArtPromptSelectorContext,
} from './art-prompt-selector.service';
import {
  buildKitOverlayPrompt,
  compositeKitOnArtBackground,
  resolveArtKitLayout,
} from './art-kit-compose.util';

export interface ArtKitComposeContext {
  resolvedProfile: ResolvedProfileValues | null;
  competitorIntelBrief?: Record<string, unknown> | null;
}

export interface ArtKitComposeResult {
  attached: boolean;
  assetIds: string[];
  recipeId?: string;
}

@Injectable()
export class ArtKitComposeService {
  private readonly logger = new Logger(ArtKitComposeService.name);

  constructor(
    private readonly artPromptSelector: ArtPromptSelectorService,
    private readonly mediaKit: ProductMediaKitService,
    private readonly assetService: AssetService,
    private readonly imageGeneration: ImageGenerationService,
    private readonly imageBranding: ImageBrandingService,
    private readonly contentService: ContentService,
    private readonly productService: ProductService,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @InjectRepository(AgentImageGenerationEntity)
    private readonly generations: Repository<AgentImageGenerationEntity>,
  ) {}

  async tryCompose(
    tenantId: string,
    userId: string,
    contentId: string,
    post: SocialCopyPost,
    productId: string,
    kit: ProductMediaKitItemEntity[],
    postIndex: number,
    ctx: ArtKitComposeContext,
    recentRecipeIds?: string[],
  ): Promise<ArtKitComposeResult> {
    const visualFormat = normalizeContentVisualFormat(post.visualFormat);
    if (visualFormat === 'talking-head') {
      return { attached: false, assetIds: [] };
    }

    try {
      const product = await this.productService.findOwnedEntity(tenantId, productId);
      const brandKit = resolveVisualBrandKit(product, ctx.resolvedProfile);
      const persisted = persistDerivedBrandVisualKit(product, brandKit);
      if (persisted !== product) {
        await this.products.save(persisted);
      }

      const selectorCtx: ArtPromptSelectorContext = {
        industry: ctx.resolvedProfile?.industry ?? null,
        competitorIntelBrief: ctx.competitorIntelBrief ?? null,
      };

      const selection = await this.artPromptSelector.selectRecipeForKitCompose(
        post,
        selectorCtx,
        brandKit,
        recentRecipeIds,
      );
      if (!selection) {
        return { attached: false, assetIds: [] };
      }

      const layout = resolveArtKitLayout(selection.recipe, post.platform, post);
      const size = resolveImageSizeForPlatform(post.platform, post.imageDestination);
      const style = resolveImageStyleForPlatform(post.platform);
      const frameCount =
        visualFormat === 'carousel' ? visualFormatToFrameCount('carousel') : 1;

      const imagePicks = await this.mediaKit.pickComposeImagePicks(
        tenantId,
        kit,
        visualFormat,
        postIndex,
        post.platform,
      );

      if (!imagePicks.length && frameCount === 1) {
        this.logger.warn(`Art-kit-compose: no kit picks for content ${contentId}`);
        return { attached: false, assetIds: [] };
      }

      let basePrompt = selection.filledPrompt.trim();
      if (brandKit) {
        basePrompt = enrichVisualDescriptionForAi(
          basePrompt,
          brandKit,
          ctx.competitorIntelBrief,
        );
      }

      const assetIds: string[] = [];
      const frames: Array<{ assetId: string; index: number }> = [];

      await runWithLlmUsageContext({ tenantId, userId }, async () => {
        for (let slideIndex = 0; slideIndex < frameCount; slideIndex += 1) {
          const pick =
            slideIndex === 0
              ? (imagePicks[0] ?? null)
              : (imagePicks[slideIndex] ?? null);
          const useKitOverlay = Boolean(pick?.assetId);

          const slidePrompt = useKitOverlay
            ? buildKitOverlayPrompt(basePrompt, selection.recipe, post)
            : basePrompt;

          const artBuffer = await this.imageGeneration.generateImageBuffer(
            tenantId,
            userId,
            slidePrompt,
            { size, style, productId, skipLogoOverlay: true },
          );

          let buffer = artBuffer;
          if (useKitOverlay && pick?.assetId) {
            const photoFile = await this.assetService
              .readFile(tenantId, pick.assetId)
              .catch(() => null);
            if (photoFile?.buffer) {
              buffer = await compositeKitOnArtBackground(
                artBuffer,
                photoFile.buffer,
                layout,
                size,
                post.platform,
                pick.device ?? null,
                post.visualTemplateId ?? null,
              );
            }
          }

          const shouldBrandLogo =
            Boolean(brandKit.logoAssetId) && (slideIndex === 0 || frameCount === 1);
          if (shouldBrandLogo && brandKit.logoAssetId) {
            buffer = await this.imageBranding
              .applyProductLogo(tenantId, buffer, brandKit.logoAssetId)
              .catch(() => buffer);
          }

          const uploaded = await this.uploadFrame(
            tenantId,
            buffer,
            contentId,
            productId,
            post.platform,
            slideIndex,
            frameCount,
            selection.recipeId,
          );
          assetIds.push(uploaded.id);
          frames.push({ assetId: uploaded.id, index: slideIndex });
        }
      });

      if (!assetIds.length) {
        return { attached: false, assetIds: [] };
      }

      await this.generations.save(
        this.generations.create({
          tenantId,
          prompt: `[art-kit-compose] ${selection.recipeId}: ${post.visualHeadline ?? post.title}`.slice(
            0,
            500,
          ),
          status: 'completed',
          productId,
          contentId,
          imageUrl: `/api/v1/assets/${assetIds[0]}/file`,
          assetId: assetIds[0] ?? null,
          metadata: {
            mediaType: 'image',
            intendedMediaType: 'image',
            frameCount,
            frames,
            pipeline: 'art-kit-compose',
            artRecipeId: selection.recipeId,
            layout,
            headline: post.visualHeadline ?? null,
            subline: post.visualSubline ?? null,
            cta: post.visualCta ?? null,
            brandKit: {
              style: brandKit.style,
              primaryColor: brandKit.primaryColor,
              secondaryColor: brandKit.secondaryColor,
              accentColor: brandKit.accentColor,
            },
          },
        }),
      );

      await this.contentService.update(tenantId, userId, contentId, {
        assets: assetIds,
        artRecipeId: selection.recipeId,
        changeSummary:
          frameCount > 1
            ? `Carrusel art+kit (${selection.recipeId}, ${frameCount} slides)`
            : `Visual art+kit (${selection.recipeId})`,
      });

      this.logger.log(
        `Art-kit-compose ${selection.recipeId} for content ${contentId} (${assetIds.length} frames)`,
      );

      return { attached: true, assetIds, recipeId: selection.recipeId };
    } catch (error) {
      this.logger.warn(
        `Art-kit-compose failed for content ${contentId}: ${error instanceof Error ? error.message : error}`,
      );
      return { attached: false, assetIds: [] };
    }
  }

  private async uploadFrame(
    tenantId: string,
    buffer: Buffer,
    contentId: string,
    productId: string,
    platform: string,
    slideIndex: number,
    frameCount: number,
    recipeId: string,
  ) {
    const suffix = frameCount > 1 ? `-slide${slideIndex + 1}` : '';
    const fakeFile: Express.Multer.File = {
      buffer,
      originalname: `art-kit-${recipeId}${suffix}.png`,
      mimetype: 'image/png',
      size: buffer.length,
      fieldname: 'file',
      encoding: '7bit',
      stream: null as unknown as import('stream').Readable,
      destination: '',
      filename: `art-kit-${recipeId}${suffix}.png`,
      path: '',
    };

    return this.assetService.upload(tenantId, fakeFile, undefined, undefined, {
      source: 'art-kit-compose',
      contentId,
      productId,
      platform,
      frameIndex: slideIndex,
      frameCount,
      artRecipeId: recipeId,
    });
  }
}
