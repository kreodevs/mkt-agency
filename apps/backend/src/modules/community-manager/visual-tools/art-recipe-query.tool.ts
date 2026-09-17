import { Injectable } from '@nestjs/common';
import type { AgentTool, ToolContext, ToolDefinition, ToolExecutionResult } from '../../../shared/ai/tools/tool.interface';
import { ART_PROMPT_RECIPES } from '../art-prompt-library/art-prompt-recipes.data';
import { SCENE_PROMPT_RECIPES } from '../art-prompt-library/scene-recipes.data';
import { filterArtPromptCandidates } from '../art-prompt-library/art-prompt-filter.util';
import type { ArtPromptFilterInput } from '../art-prompt-library/art-prompt.types';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';

export interface ArtRecipeSummary {
  id: string;
  name: string;
  family: string;
  description: string;
  intents: string[];
  industries: string[];
  platforms: string[];
  formats: string[];
  supportsMediaKitOverlay: boolean;
  kitLayout: string | null;
  score: number;
}

@Injectable()
export class ArtRecipeQueryTool implements AgentTool {
  readonly definition: ToolDefinition = {
    name: 'query_art_prompt_recipes',
    description: 'Busca recetas de prompts visuales (arte IA) candidatas según intent, industria, plataforma, formato y estilo. Devuelve las mejores opciones con su descripción para que el LLM elija la más adecuada.',
    inputSchema: {
      type: 'object',
      properties: {
        intent: {
          type: 'string',
          description: 'Objetivo visual: educate | promote | announce | inspire | compare | story | tips | data | brand | product',
        },
        industry: {
          type: 'string',
          description: 'Industria del producto (ej: saas, fintech, health, ecommerce)',
        },
        platform: {
          type: 'string',
          description: 'Plataforma destino: instagram | linkedin | twitter | facebook | tiktok',
        },
        format: {
          type: 'string',
          description: 'Formato visual: image | carousel',
        },
        style: {
          type: 'string',
          description: 'Estilo visual deseado: minimal | bold | luxury | editorial | playful | technical | photoreal | illustration | flatlay | infographic',
        },
        includeSceneRecipes: {
          type: 'boolean',
          description: 'Incluir también recetas de escenas creativas premium (con CM virtual + app)',
        },
        limit: {
          type: 'number',
          description: 'Máximo de recetas a devolver (default: 5)',
        },
      },
      required: ['intent', 'platform'],
    },
  };

  async execute(input: Record<string, unknown>, _ctx: ToolContext): Promise<ToolExecutionResult> {
    try {
      const platform = ((input.platform as string) ?? 'instagram') as SocialCopyPost['platform'];
      const intent = (input.intent as string) ?? 'promote';

      const post: SocialCopyPost = {
        id: 'tool-query',
        platform,
        title: '',
        body: '',
        hashtags: [],
        visualDescription: '',
        visualFormat: (input.format as 'image' | 'carousel') ?? 'image',
        bestTime: '',
        targetAudience: '',
        callToAction: '',
        tone: '',
      };

      const filterInput: ArtPromptFilterInput = {
        post,
        industry: (input.industry as string) ?? null,
        brandKit: null,
        recentRecipeIds: [],
        visualIntent: {
          goal: intent,
          style: (input.style as never) ?? undefined,
        },
      };

      const candidates = filterArtPromptCandidates(ART_PROMPT_RECIPES, filterInput);
      const limit = (input.limit as number) ?? 5;

      let recipes: ArtRecipeSummary[] = candidates.slice(0, limit).map((c) => ({
        id: c.id,
        name: c.name,
        family: c.family,
        description: c.description,
        intents: c.intents,
        industries: c.industries,
        platforms: c.platforms,
        formats: c.formats,
        supportsMediaKitOverlay: c.supportsMediaKitOverlay ?? false,
        kitLayout: c.kitLayout ?? null,
        score: c.score,
      }));

      if (input.includeSceneRecipes) {
        const sceneCandidates = filterArtPromptCandidates(
          SCENE_PROMPT_RECIPES as unknown as typeof ART_PROMPT_RECIPES,
          filterInput,
        );
        const sceneRecipes: ArtRecipeSummary[] = sceneCandidates.slice(0, limit).map((c) => ({
          id: c.id,
          name: c.name,
          family: c.family,
          description: c.description,
          intents: c.intents,
          industries: c.industries,
          platforms: c.platforms,
          formats: c.formats,
          supportsMediaKitOverlay: (c as unknown as { supportsMediaKitOverlay?: boolean }).supportsMediaKitOverlay ?? false,
          kitLayout: (c as unknown as { kitLayout?: string }).kitLayout ?? null,
          score: c.score,
        }));
        recipes = [...recipes, ...sceneRecipes];
      }

      return { success: true, result: { recipes } };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
