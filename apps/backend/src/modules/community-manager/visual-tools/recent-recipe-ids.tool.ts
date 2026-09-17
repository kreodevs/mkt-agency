import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AgentTool, ToolContext, ToolDefinition, ToolExecutionResult } from '../../../shared/ai/tools/tool.interface';
import { AgentImageGenerationEntity } from '../../agents/domain/agent-image-generation.entity';
import { Injectable } from '@nestjs/common';

export interface RecentRecipeIdsResult {
  recentRecipeIds: string[];
  count: number;
}

@Injectable()
export class RecentRecipeIdsTool implements AgentTool {
  readonly definition: ToolDefinition = {
    name: 'get_recent_recipe_ids',
    description: 'Obtiene los últimos artRecipeId usados para el tenant. Sirve para evitar repetir la misma receta visual en posts recientes y así mantener variedad visual.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Máximo de recetas recientes a devolver (default: 5)',
        },
      },
    },
  };

  constructor(
    @InjectRepository(AgentImageGenerationEntity)
    private readonly generations: Repository<AgentImageGenerationEntity>,
  ) {}

  async execute(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolExecutionResult> {
    try {
      const limit = (input.limit as number) ?? 5;

      const recent = await this.generations.find({
        where: { tenantId: ctx.tenantId },
        order: { createdAt: 'DESC' },
        take: Math.max(limit, 20),
      });

      const recipeIds: string[] = [];
      for (const gen of recent) {
        const metadata = gen.metadata as Record<string, unknown> | null;
        const artRecipeId = typeof metadata?.artRecipeId === 'string' ? metadata.artRecipeId : null;
        const prompt = gen.prompt ?? '';
        const match = prompt.match(/\[art-kit-compose\]\s+(\S+)/);
        const extractedId = artRecipeId ?? (match ? match[1] : null);
        if (extractedId && !recipeIds.includes(extractedId)) {
          recipeIds.push(extractedId);
        }
        if (recipeIds.length >= limit) break;
      }

      return { success: true, result: { recentRecipeIds: recipeIds, count: recipeIds.length } as RecentRecipeIdsResult };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
