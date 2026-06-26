import { Injectable } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import {
  GeneratedStrategyResult,
  StrategyAdapterPort,
  StrategyGenerationContext,
} from './strategy.adapter.port';

@Injectable()
export class OpenRouterStrategyAdapter implements StrategyAdapterPort {
  constructor(private readonly llm: LlmClient) {}

  async generate(context: StrategyGenerationContext): Promise<GeneratedStrategyResult> {
    const systemPrompt =
      'Eres un estratega de marketing digital. Responde SOLO con JSON válido con esta forma: ' +
      '{"strategy":{"summary":"...","channels":[{"platform":"...","focus":"..."}],"timeline":"...","kpis":[]},' +
      '"budgets":[{"platform":"...","dailyBudget":number,"totalBudget":number}]}. ' +
      'Usa español neutro. dailyBudget y totalBudget deben ser números positivos.';

    const userPrompt = JSON.stringify({
      task: 'Generar estrategia de campaña y presupuestos por plataforma.',
      campaign: context.campaign,
      companyProfile: context.companyProfile,
    });

    const result = await this.llm.chatJson<GeneratedStrategyResult>(
      systemPrompt,
      userPrompt,
    );

    if (!result?.strategy || !Array.isArray(result.budgets)) {
      throw new Error('Invalid strategy response from LLM');
    }

    return result;
  }
}
