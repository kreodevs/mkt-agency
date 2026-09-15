import { Injectable, Logger } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import type { ResolvedVisualBrandKit } from '../domain/visual-brand-kit.util';
import { enrichVisualDescriptionForAi } from '../domain/visual-prompt-enrichment.util';
import { ART_PROMPT_RECIPES } from './art-prompt-recipes.data';
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

    const candidates = this.filterKitComposeCandidates(input);
    if (!candidates.length) {
      this.logger.warn('No art-kit-compose overlay recipes matched; falling back to all recipes');
      return this.selectRecipe(post, ctx, brandKit, recentRecipeIds);
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
