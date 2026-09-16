import { Injectable, Logger } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import type { ResolvedVisualBrandKit } from '../domain/visual-brand-kit.util';
import { enrichVisualDescriptionForAi } from '../domain/visual-prompt-enrichment.util';
import { ART_PROMPT_RECIPES } from './art-prompt-recipes.data';
import { SCENE_PROMPT_RECIPES } from './scene-recipes.data';
import { resolveEffectiveScene } from './scene-routing.util';
import {
  filterArtPromptCandidates,
  resolveArtPromptAspectRatio,
} from './art-prompt-filter.util';
import {
  buildDefaultSlots,
  fillRecipeTemplate,
  mergeSlotContextFromBrandKit,
} from './art-prompt-slot.util';
import type {
  ArtPromptCandidate,
  ArtPromptFilterInput,
  ArtPromptSelection,
  ArtPromptSlotContext,
  ResolvedArtVisualPrompt,
  ScenePromptRecipe,
  ScenePromptSelection,
} from './art-prompt.types';
import {
  resolveVisualIntent,
  shouldUseArtPromptLibrary,
} from './visual-intent.util';
import type { ProductMediaKitItemEntity } from '../../product/infrastructure/typeorm/product-media-kit-item.entity';

export interface ArtPromptSelectorContext {
  industry?: string | null;
  competitorIntelBrief?: Record<string, unknown> | null;
}

@Injectable()
export class ArtPromptSelectorService {
  private readonly logger = new Logger(ArtPromptSelectorService.name);

  constructor(private readonly llm: LlmClient) {}

  filterCandidates(input: ArtPromptFilterInput): ArtPromptCandidate[] {
    return filterArtPromptCandidates(ART_PROMPT_RECIPES, input);
  }

  filterKitComposeCandidates(input: ArtPromptFilterInput): ArtPromptCandidate[] {
    const overlayRecipes = ART_PROMPT_RECIPES.filter((recipe) => recipe.supportsMediaKitOverlay);
    return filterArtPromptCandidates(overlayRecipes, input);
  }

  filterSceneCandidates(
    input: ArtPromptFilterInput,
    effectiveScene: ReturnType<typeof resolveEffectiveScene>,
  ): ArtPromptCandidate[] {
    const sceneRecipes = SCENE_PROMPT_RECIPES.filter((recipe) => {
      if (effectiveScene === 'auto') return true;
      return recipe.sceneType === effectiveScene;
    });
    return filterArtPromptCandidates(sceneRecipes, input);
  }

  async selectSceneRecipe(
    post: SocialCopyPost,
    ctx: ArtPromptSelectorContext,
    brandKit?: ResolvedVisualBrandKit | null,
    recentRecipeIds?: string[],
  ): Promise<ScenePromptSelection | null> {
    const visualIntent = resolveVisualIntent(post);
    const effectiveScene = resolveEffectiveScene(post, ctx.industry);
    const input: ArtPromptFilterInput = {
      post,
      brandKit,
      industry: ctx.industry,
      recentRecipeIds,
      visualIntent,
    };

    const candidates = this.filterSceneCandidates(input, effectiveScene);
    const pool =
      candidates.length > 0
        ? (candidates as Array<ArtPromptCandidate & ScenePromptRecipe>)
        : SCENE_PROMPT_RECIPES;

    if (!candidates.length) {
      this.logger.warn(
        `No scene recipes matched for scene=${effectiveScene}; using all scene recipes`,
      );
    }

    return this.selectSceneFromPool(
      pool,
      post,
      ctx,
      brandKit,
      recentRecipeIds,
      effectiveScene,
    );
  }

  private async selectSceneFromPool(
    pool: ScenePromptRecipe[],
    post: SocialCopyPost,
    ctx: ArtPromptSelectorContext,
    brandKit?: ResolvedVisualBrandKit | null,
    recentRecipeIds?: string[],
    effectiveScene?: ReturnType<typeof resolveEffectiveScene>,
  ): Promise<ScenePromptSelection | null> {
    const visualIntent = resolveVisualIntent(post);
    const input: ArtPromptFilterInput = {
      post,
      brandKit,
      industry: ctx.industry,
      recentRecipeIds,
      visualIntent,
    };

    const candidates = filterArtPromptCandidates(pool, input) as Array<
      ArtPromptCandidate & ScenePromptRecipe
    >;
    if (!candidates.length) {
      return null;
    }

    const aspectRatioHint = resolveArtPromptAspectRatio(post);
    const slotCtx = this.buildSlotContext(post, brandKit, ctx.industry);
    const slots = buildDefaultSlots(slotCtx, post);
    const scene = effectiveScene ?? resolveEffectiveScene(post, ctx.industry);

    if (candidates.length === 1) {
      const candidate = candidates[0];
      return {
        recipeId: candidate.id,
        recipe: candidate,
        filledPrompt: fillRecipeTemplate(candidate.template, slots),
        aspectRatioHint,
        score: candidate.score,
        selectionMethod: 'deterministic',
        effectiveScene: scene,
      };
    }

    const selected = await this.selectWithLlm(post, candidates, visualIntent);
    const candidate = (selected ?? candidates[0]) as ArtPromptCandidate & ScenePromptRecipe;

    return {
      recipeId: candidate.id,
      recipe: candidate,
      filledPrompt: fillRecipeTemplate(candidate.template, slots),
      aspectRatioHint,
      score: candidate.score,
      selectionMethod: selected ? 'llm' : 'deterministic',
      effectiveScene: scene,
    };
  }

  async selectRecipeForKitCompose(
    post: SocialCopyPost,
    ctx: ArtPromptSelectorContext,
    brandKit?: ResolvedVisualBrandKit | null,
    recentRecipeIds?: string[],
  ): Promise<ArtPromptSelection | null> {
    const visualIntent = resolveVisualIntent(post);
    const input: ArtPromptFilterInput = {
      post,
      brandKit,
      industry: ctx.industry,
      recentRecipeIds,
      visualIntent,
    };

    let candidates = this.filterKitComposeCandidates(input);
    if (!candidates.length) {
      this.logger.warn('No art-kit-compose overlay recipes matched; falling back to all recipes');
      return this.selectRecipe(post, ctx, brandKit, recentRecipeIds);
    }

    const wantsProductMockup =
      post.visualTemplateId === 'product-hero' || post.visualTemplateId === 'promo-cta';
    if (wantsProductMockup) {
      const mockupCandidates = candidates.filter(
        (recipe) => recipe.kitLayout === 'mockup' || recipe.family === 'product-hero',
      );
      if (mockupCandidates.length) {
        candidates = mockupCandidates;
      }
      const heroRecipe = candidates.find((recipe) => recipe.id === 'product-hero-json-050');
      if (heroRecipe) {
        candidates = [heroRecipe, ...candidates.filter((recipe) => recipe.id !== heroRecipe.id)];
      }
    }

    const aspectRatioHint = resolveArtPromptAspectRatio(post);
    const slotCtx = this.buildSlotContext(post, brandKit, ctx.industry);
    const slots = buildDefaultSlots(slotCtx, post);

    if (candidates.length === 1) {
      const recipe = candidates[0];
      return {
        recipeId: recipe.id,
        recipe,
        filledPrompt: fillRecipeTemplate(recipe.template, slots),
        aspectRatioHint,
        score: recipe.score,
        selectionMethod: 'deterministic',
      };
    }

    const selected = await this.selectWithLlm(post, candidates, visualIntent);
    const recipe = selected ?? candidates[0];

    return {
      recipeId: recipe.id,
      recipe,
      filledPrompt: fillRecipeTemplate(recipe.template, slots),
      aspectRatioHint,
      score: recipe.score,
      selectionMethod: selected ? 'llm' : 'deterministic',
    };
  }

  async selectRecipe(
    post: SocialCopyPost,
    ctx: ArtPromptSelectorContext,
    brandKit?: ResolvedVisualBrandKit | null,
    recentRecipeIds?: string[],
  ): Promise<ArtPromptSelection | null> {
    const visualIntent = resolveVisualIntent(post);
    const input: ArtPromptFilterInput = {
      post,
      brandKit,
      industry: ctx.industry,
      recentRecipeIds,
      visualIntent,
    };

    const candidates = this.filterCandidates(input);
    if (!candidates.length) {
      return null;
    }

    const aspectRatioHint = resolveArtPromptAspectRatio(post);
    const slotCtx = this.buildSlotContext(post, brandKit, ctx.industry);
    const slots = buildDefaultSlots(slotCtx, post);

    if (candidates.length === 1) {
      const recipe = candidates[0];
      return {
        recipeId: recipe.id,
        recipe,
        filledPrompt: fillRecipeTemplate(recipe.template, slots),
        aspectRatioHint,
        score: recipe.score,
        selectionMethod: 'deterministic',
      };
    }

    const selected = await this.selectWithLlm(post, candidates, visualIntent);
    const recipe = selected ?? candidates[0];

    return {
      recipeId: recipe.id,
      recipe,
      filledPrompt: fillRecipeTemplate(recipe.template, slots),
      aspectRatioHint,
      score: recipe.score,
      selectionMethod: selected ? 'llm' : 'deterministic',
    };
  }

  async resolveVisualPrompt(
    post: SocialCopyPost,
    ctx: ArtPromptSelectorContext,
    brandKit?: ResolvedVisualBrandKit | null,
    recentRecipeIds?: string[],
    kit?: ProductMediaKitItemEntity[] | null,
  ): Promise<ResolvedArtVisualPrompt> {
    const aspectRatioHint = resolveArtPromptAspectRatio(post);

    if (!shouldUseArtPromptLibrary(post, kit)) {
      return {
        visualDescription: post.visualDescription?.trim() ?? '',
        recipeId: null,
        aspectRatioHint,
        skipped: true,
        skipReason: 'art_prompt_library_not_applicable',
      };
    }

    const selection = await this.selectRecipe(post, ctx, brandKit, recentRecipeIds);
    if (!selection) {
      const fallback = post.visualDescription?.trim() ?? '';
      return {
        visualDescription: brandKit
          ? enrichVisualDescriptionForAi(fallback, brandKit, ctx.competitorIntelBrief)
          : fallback,
        recipeId: null,
        aspectRatioHint,
        skipped: true,
        skipReason: 'no_matching_recipe',
      };
    }

    const artRecipeBasePrompt = selection.filledPrompt.trim();
    let visualDescription = artRecipeBasePrompt;
    if (brandKit) {
      visualDescription = enrichVisualDescriptionForAi(
        visualDescription,
        brandKit,
        ctx.competitorIntelBrief,
      );
    }

    this.logger.log(
      `Art prompt recipe selected: ${selection.recipeId} (${selection.selectionMethod}, score=${selection.score})`,
    );

    return {
      visualDescription,
      recipeId: selection.recipeId,
      aspectRatioHint: selection.aspectRatioHint,
      artRecipeBasePrompt,
    };
  }

  private buildSlotContext(
    post: SocialCopyPost,
    brandKit?: ResolvedVisualBrandKit | null,
    industry?: string | null,
  ): ArtPromptSlotContext {
    const visualIntent = resolveVisualIntent(post);
    const base = brandKit
      ? mergeSlotContextFromBrandKit(brandKit, industry)
      : { productName: 'Tu marca', industry: industry ?? undefined };

    return {
      ...base,
      subject: visualIntent.subject,
      goal: visualIntent.goal,
      headline: post.visualHeadline,
      subline: post.visualSubline,
      cta: post.visualCta,
      visualDescription: post.visualDescription,
      platform: post.platform,
      style: visualIntent.style ?? base.style,
    };
  }

  private async selectWithLlm(
    post: SocialCopyPost,
    candidates: ArtPromptCandidate[],
    visualIntent: ReturnType<typeof resolveVisualIntent>,
  ): Promise<ArtPromptCandidate | null> {
    try {
      const configured = await this.llm.isConfigured();
      if (!configured) {
        return null;
      }

      const systemPrompt =
        'Eres un director de arte para redes sociales. Elige la receta de prompt visual más adecuada para un post. ' +
        'Responde SOLO JSON: { "recipeId": "id-elegido", "reason": "breve justificación" }';

      const userPrompt = [
        `Post: ${post.title}`,
        `Plataforma: ${post.platform}`,
        `Formato: ${post.visualFormat}`,
        `Visual description: ${post.visualDescription}`,
        `Visual intent: ${JSON.stringify(visualIntent)}`,
        `Candidatas (ordenadas por score): ${JSON.stringify(
          candidates.map((c) => ({
            id: c.id,
            name: c.name,
            family: c.family,
            score: c.score,
            description: c.description,
          })),
        )}`,
        'Elige UNA receta de la lista. Usa exactamente el id de una candidata.',
      ].join('\n\n');

      const result = await this.llm.chatJson<{ recipeId?: string }>(systemPrompt, userPrompt, {
        taskType: 'social_copy',
        temperature: 0.2,
        maxTokens: 512,
      });

      const recipeId = result.recipeId?.trim();
      if (!recipeId) return null;

      return candidates.find((c) => c.id === recipeId) ?? null;
    } catch (error) {
      this.logger.warn(
        `LLM art recipe selection failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}
