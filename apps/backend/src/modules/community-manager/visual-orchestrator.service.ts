import { Injectable, Logger } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { ImageGenerationService } from '../agents/image-generation.service';
import { TalkingHeadPostComposerService } from './talking-head-post-composer.service';
import { VisualTemplateComposerService } from './visual-template-composer.service';
import { ArtKitComposeService } from './art-prompt-library/art-kit-compose.service';
import { SceneKitComposeService } from './art-prompt-library/scene-kit-compose.service';
import { ArtPromptSelectorService } from './art-prompt-library/art-prompt-selector.service';
import { CmCharacterService } from './cm-character.service';
import { GenerationContext } from './generation-context.facade';
import { SocialCopyPost } from './adapters/social-copy.adapter.port';
import { resolveVisualBrandKit } from './domain/visual-brand-kit.util';
import { enrichVisualDescriptionForAi } from './domain/visual-prompt-enrichment.util';
import { kitHasComposeImageRoles } from '../product/domain/product-media-kit.constants';
import { normalizeContentVisualFormat } from '../content/domain/content-visual-format.util';
import { isAiArtTemplateId } from './domain/visual-template.constants';
import {
  resolveVisualIntent,
  shouldUseArtKitCompose,
  shouldUseArtPromptLibrary,
} from './art-prompt-library/visual-intent.util';
import {
  shouldSkipTemplateForCreativeScene,
  shouldUseCreativeScene,
  wantsProductScreenShowcase,
} from './art-prompt-library/scene-routing.util';
import {
  feedbackRequestsAiImage,
  feedbackRequestsMediaKit,
  parseFeedbackTargetFrames,
} from './domain/feedback-visual-intent.util';
import { visualFormatToFrameCount } from '../content/domain/content-visual-format.util';

interface ComposeOptions {
  targetSlideIndices?: number[];
  existingAssetIds?: string[];
  variationSeed: number;
}

@Injectable()
export class VisualOrchestratorService {
  private readonly logger = new Logger(VisualOrchestratorService.name);

  constructor(
    private readonly talkingHeadComposer: TalkingHeadPostComposerService,
    private readonly templateComposer: VisualTemplateComposerService,
    private readonly artKitCompose: ArtKitComposeService,
    private readonly sceneKitCompose: SceneKitComposeService,
    private readonly cmCharacter: CmCharacterService,
    private readonly productService: ProductService,
    private readonly artPromptSelector: ArtPromptSelectorService,
    private readonly imageGeneration: ImageGenerationService,
  ) {}

  async attachVisualForPost(
    tenantId: string,
    userId: string,
    contentId: string,
    post: SocialCopyPost,
    productId: string | null | undefined,
    kit: GenerationContext['kit'],
    postIndex: number,
    ctx: GenerationContext,
    recentRecipeIds?: string[],
  ): Promise<boolean> {
    const visualFormat = normalizeContentVisualFormat(post.visualFormat);

    if (visualFormat === 'talking-head' && productId) {
      const attached = await this.talkingHeadComposer.attachToContent(
        tenantId, userId, contentId, post, productId,
      );
      if (attached) return true;

      this.logger.log(`Talking-head falló para ${contentId}; reintentando con plantilla`);
      const staticPost: SocialCopyPost = { ...post, visualFormat: 'image' as const };
      const fallback = await this.templateComposer.tryComposeFromTemplate(
        tenantId, userId, contentId, staticPost, productId, kit, postIndex,
        { resolvedProfile: ctx.resolvedProfile },
      );
      if (fallback.attached) return true;
    }

    const intent = resolveVisualIntent(post);
    const skipAiArt = intent.preferLayout === 'ai-art';

    const cmPortraitAssetId = productId
      ? await this.cmCharacter.resolveDefaultPortraitAssetId(tenantId, productId).catch(() => null)
      : null;
    const sceneOptions = { postIndex, cmPortraitReady: Boolean(cmPortraitAssetId) };

    if (productId && wantsProductScreenShowcase(post) && shouldUseArtKitCompose(post, kit, sceneOptions)) {
      const result = await this.artKitCompose.tryCompose(
        tenantId, userId, contentId, post, productId, kit, postIndex,
        { resolvedProfile: ctx.resolvedProfile, competitorIntelBrief: ctx.competitorIntelBrief },
        recentRecipeIds,
      );
      if (result.attached) {
        if (result.recipeId) post.artRecipeId = result.recipeId;
        return true;
      }
    }

    if (productId && shouldUseCreativeScene(post, kit, sceneOptions)) {
      const result = await this.sceneKitCompose.tryCompose(
        tenantId, userId, contentId, post, productId, kit, postIndex,
        { resolvedProfile: ctx.resolvedProfile, competitorIntelBrief: ctx.competitorIntelBrief },
        recentRecipeIds,
      );
      if (result.attached) {
        if (result.recipeId) post.artRecipeId = result.recipeId;
        return true;
      }
    }

    const skipCreative = shouldSkipTemplateForCreativeScene(post, kit, sceneOptions);

    if (productId && !skipAiArt && !skipCreative) {
      const templated = await this.templateComposer.tryComposeFromTemplate(
        tenantId, userId, contentId, post, productId, kit, postIndex,
        { resolvedProfile: ctx.resolvedProfile },
      );
      if (templated.attached) return true;
    }

    if (productId && shouldUseArtKitCompose(post, kit, sceneOptions)) {
      const result = await this.artKitCompose.tryCompose(
        tenantId, userId, contentId, post, productId, kit, postIndex,
        { resolvedProfile: ctx.resolvedProfile, competitorIntelBrief: ctx.competitorIntelBrief },
        recentRecipeIds,
      );
      if (result.attached) {
        if (result.recipeId) post.artRecipeId = result.recipeId;
        return true;
      }
    }

    if (kitHasComposeImageRoles(kit) && !isAiArtTemplateId(post.visualTemplateId)) {
      this.logger.warn(`Media kit disponible pero composición falló para ${contentId}`);
      return false;
    }

    if (!post.visualDescription?.trim() && !post.visualIntent?.subject?.trim()) {
      return false;
    }

    return this.generateAiImage(tenantId, userId, contentId, post, productId, kit, ctx, recentRecipeIds);
  }

  private async generateAiImage(
    tenantId: string, userId: string, contentId: string,
    post: SocialCopyPost, productId: string | null | undefined,
    kit: GenerationContext['kit'], ctx: GenerationContext,
    recentRecipeIds?: string[],
  ): Promise<boolean> {
    try {
      let visualDescription = post.visualDescription?.trim() ?? '';
      let artRecipeBasePrompt: string | undefined;
      let artRecipeId: string | undefined;

      if (shouldUseArtPromptLibrary(post, kit)) {
        const brandKit = productId
          ? resolveVisualBrandKit(
              await this.productService.findOwnedEntity(tenantId, productId),
              ctx.resolvedProfile,
            )
          : null;

        const resolved = await this.artPromptSelector.resolveVisualPrompt(
          post,
          { industry: ctx.resolvedProfile?.industry ?? null, competitorIntelBrief: ctx.competitorIntelBrief },
          brandKit, recentRecipeIds, kit,
        );

        if (resolved.recipeId) {
          artRecipeId = resolved.recipeId;
          artRecipeBasePrompt = resolved.artRecipeBasePrompt;
          visualDescription = resolved.visualDescription;
          post.artRecipeId = resolved.recipeId;
        } else if (resolved.visualDescription) {
          visualDescription = resolved.visualDescription;
        }
      } else if (visualDescription) {
        visualDescription = await this.buildEnrichedVisualDescription(
          tenantId, visualDescription, productId ?? undefined, ctx,
        );
      }

      if (!visualDescription.trim()) return false;

      const imageResult = await this.imageGeneration.attachVisualToContent(
        tenantId, userId, contentId, visualDescription, productId ?? undefined,
        { artRecipeBasePrompt, artRecipeId },
      );
      return imageResult?.status === 'completed';
    } catch (error) {
      this.logger.warn(`Image attach failed for ${contentId}`, error);
      return false;
    }
  }

  async handlePostRegenerationVisual(
    tenantId: string, userId: string, contentId: string,
    post: SocialCopyPost, productId: string | null | undefined,
    kit: GenerationContext['kit'], visualVariantIndex: number,
    ctx: GenerationContext, feedback: string | undefined,
    currentVersion: { versionNumber?: number; assets?: unknown } | null,
    recomposeVisual: (tenantId: string, userId: string, contentId: string, options?: { mode?: 'recompose' | 'regenerate' }) => Promise<void>,
  ): Promise<void> {
    const hasKitImages = kitHasComposeImageRoles(kit);
    const wantsMediaKit = feedbackRequestsMediaKit(feedback) || hasKitImages;
    const allowAiFallback = feedbackRequestsAiImage(feedback) || (!hasKitImages && !feedbackRequestsMediaKit(feedback));
    const composeOptions = this.buildComposeOptions(post, feedback, currentVersion);
    const composeCtx = { resolvedProfile: ctx.resolvedProfile };

    if (productId && hasKitImages) {
      if (composeOptions.targetSlideIndices) {
        const partial = await this.templateComposer.tryComposeFromTemplate(
          tenantId, userId, contentId, post, productId, kit, visualVariantIndex,
          composeCtx, composeOptions,
        );
        if (partial.attached) return;
      }

      const composed = await this.attachVisualForPost(
        tenantId, userId, contentId, post, productId, kit, visualVariantIndex, ctx,
      );
      if (composed) return;

      const recomposed = await this.templateComposer.recomposeFromStoredTemplate(
        tenantId, userId, contentId, post, productId, kit, visualVariantIndex,
        composeCtx, composeOptions,
      );
      if (recomposed) return;

      if (feedback) {
        const varied = await this.templateComposer.tryComposeFromTemplate(
          tenantId, userId, contentId, post, productId, kit, visualVariantIndex,
          composeCtx, composeOptions,
        );
        if (varied.attached) return;
      }
    }

    if (!feedback) {
      await this.regenerateVisualWithoutFeedback(
        tenantId, userId, contentId, post, productId, kit, ctx, recomposeVisual,
      );
      return;
    }

    if (wantsMediaKit && hasKitImages && !feedbackRequestsAiImage(feedback)) {
      this.logger.warn(`Media kit compose failed for ${contentId} despite kit items`);
      return;
    }

    if (!post.visualDescription?.trim()) return;

    if (productId) {
      const composed = await this.attachVisualForPost(
        tenantId, userId, contentId, post, productId, kit, visualVariantIndex, ctx,
      );
      if (composed) return;
    }

    if (!allowAiFallback) return;

    try {
      await this.imageGeneration.regenerateForContent(tenantId, userId, contentId);
    } catch (error) {
      this.logger.warn(`Visual regenerate failed for ${contentId}`, error);
    }
  }

  private async regenerateVisualWithoutFeedback(
    tenantId: string, userId: string, contentId: string,
    post: SocialCopyPost, productId: string | null | undefined,
    kit: GenerationContext['kit'], ctx: GenerationContext,
    recomposeVisual: (tenantId: string, userId: string, contentId: string, options?: { mode?: 'recompose' | 'regenerate' }) => Promise<void>,
  ): Promise<void> {
    try {
      if (productId) {
        const templated = await this.attachVisualForPost(
          tenantId, userId, contentId, post, productId, kit, 0, ctx,
        );
        if (templated) return;
      }

      if (!post.visualDescription?.trim()) {
        if (kitHasComposeImageRoles(kit)) {
          await recomposeVisual(tenantId, userId, contentId, { mode: 'regenerate' });
          return;
        }
        await this.imageGeneration.regenerateForContent(tenantId, userId, contentId);
        return;
      }

      const enriched = await this.buildEnrichedVisualDescription(
        tenantId, post.visualDescription, productId ?? undefined, ctx,
      );
      await this.imageGeneration.attachVisualToContent(
        tenantId, userId, contentId, enriched, productId ?? undefined,
      );
    } catch (error) {
      this.logger.warn(`Visual regenerate failed for ${contentId}`, error);
    }
  }

  async buildEnrichedVisualDescription(
    tenantId: string, visualDescription: string,
    productId: string | undefined, ctx: GenerationContext,
  ): Promise<string> {
    if (!productId) return visualDescription;
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const brandKit = resolveVisualBrandKit(product, ctx.resolvedProfile);
    return enrichVisualDescriptionForAi(visualDescription, brandKit, ctx.competitorIntelBrief);
  }

  buildComposeOptions(
    post: SocialCopyPost, feedback: string | undefined,
    currentVersion: { versionNumber?: number; assets?: unknown } | null,
  ): ComposeOptions {
    const visualVariantIndex = currentVersion?.versionNumber ?? 0;
    const frameCount = normalizeContentVisualFormat(post.visualFormat) === 'carousel' ? 5 : 1;
    const targetSlideIndices = parseFeedbackTargetFrames(feedback, frameCount);
    const existingAssetIds = this.extractVersionAssetIds(currentVersion);

    return {
      ...(targetSlideIndices && existingAssetIds.length > 0 ? { targetSlideIndices, existingAssetIds } : {}),
      variationSeed: visualVariantIndex + (targetSlideIndices?.length ?? 1) + 1,
    };
  }

  private extractVersionAssetIds(version: { assets?: unknown } | null | undefined): string[] {
    if (!version?.assets || !Array.isArray(version.assets)) return [];
    return version.assets
      .map((asset: unknown) => {
        if (typeof asset === 'string') return asset;
        if (asset && typeof asset === 'object' && 'id' in asset) {
          const id = (asset as { id?: unknown }).id;
          return typeof id === 'string' ? id : null;
        }
        return null;
      })
      .filter((id: string | null): id is string => Boolean(id));
  }
}
