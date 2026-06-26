import { Injectable } from '@nestjs/common';
import {
  GeneratedStrategyResult,
  StrategyAdapterPort,
  StrategyGenerationContext,
} from './strategy.adapter.port';

@Injectable()
export class StubStrategyAdapter implements StrategyAdapterPort {
  async generate(context: StrategyGenerationContext): Promise<GeneratedStrategyResult> {
    const platforms =
      context.campaign.platforms.length > 0
        ? context.campaign.platforms
        : ['facebook', 'instagram', 'google'];

    const totalBudget = context.campaign.totalBudget ?? 3000;
    const perPlatform = totalBudget / platforms.length;
    const dailyBudget = Math.round((perPlatform / 30) * 100) / 100;

    return {
      strategy: {
        summary: `Estrategia multicanal para ${context.campaign.name} orientada a ${context.campaign.objective ?? 'generar awareness y leads'}.`,
        channels: platforms.map((platform) => ({
          platform,
          focus: platform === 'google' ? 'Search + remarketing' : 'Awareness + conversión',
        })),
        timeline: 'Fase 1 (semana 1-2): setup y creativos. Fase 2 (semana 3-8): optimización.',
        kpis: ['CTR', 'CPL', 'ROAS'],
      },
      budgets: platforms.map((platform) => ({
        platform,
        dailyBudget,
        totalBudget: Math.round(perPlatform * 100) / 100,
      })),
    };
  }
}
