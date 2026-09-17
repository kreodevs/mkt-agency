import { Injectable } from '@nestjs/common';
import type { AgentTool, ToolContext, ToolDefinition, ToolExecutionResult } from '../../../shared/ai/tools/tool.interface';
import { CompetitorIntelService } from '../../agents/competitor-intel.service';
import { buildCompetitorVisualAngle } from '../domain/visual-brand-kit.util';

export interface CompetitorAngleResult {
  angle: string | null;
  hasCompetitorIntel: boolean;
}

@Injectable()
export class CompetitorVisualAngleTool implements AgentTool {
  readonly definition: ToolDefinition = {
    name: 'get_competitor_visual_angle',
    description: 'Obtiene el ángulo diferenciador visual frente a la competencia. Devuelve la recomendación del último análisis de competidores para usarla como inspiración en la dirección creativa del arte.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  };

  constructor(
    private readonly competitorIntel: CompetitorIntelService,
  ) {}

  async execute(_input: Record<string, unknown>, ctx: ToolContext): Promise<ToolExecutionResult> {
    try {
      const latest = await this.competitorIntel.getLatestCompletedAnalysis(ctx.tenantId);
      if (!latest?.analysis) {
        return { success: true, result: { angle: null, hasCompetitorIntel: false } as CompetitorAngleResult };
      }

      const analysis = latest.analysis as Record<string, unknown>;
      const angle = buildCompetitorVisualAngle(analysis);

      return { success: true, result: { angle, hasCompetitorIntel: true } as CompetitorAngleResult };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
