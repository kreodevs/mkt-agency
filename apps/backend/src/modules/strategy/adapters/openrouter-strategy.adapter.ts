import { Injectable } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import {
  StrategyAdjustmentAdapterPort,
  StrategyAnalysisData,
} from './strategy.adapter.port';

@Injectable()
export class OpenRouterStrategyAdapter implements StrategyAdjustmentAdapterPort {
  constructor(private readonly llm: LlmClient) {}

  async analyze(context: Parameters<StrategyAdjustmentAdapterPort['analyze']>[0]): Promise<StrategyAnalysisData> {
    const systemPrompt =
      'Eres un estratega de marketing digital senior. Analiza los datos y genera recomendaciones accionables. ' +
      'Responde SOLO con JSON válido con esta estructura exacta: ' +
      '{' +
      '"summary":"resumen ejecutivo del rendimiento actual (2-3 líneas)",' +
      '"overallHealth":"good|fair|poor",' +
      '"topPerforming":["lista de lo que está funcionando"],' +
      '"underperforming":["lista de lo que no funciona"],' +
      '"suggestions":[' +
      '{' +
      '"id":"sug-1",' +
      '"channel":"canal específico (Instagram, Email, Blog, etc)",' +
      '"currentPerformance":"descripción corta del rendimiento actual",' +
      '"insight":"por qué está pasando esto",' +
      '"recommendation":"acción concreta a tomar",' +
      '"actionType":"adjust_content|reallocate_budget|change_strategy|pause_channel|amplify",' +
      '"expectedImpact":"qué se espera lograr",' +
      '"status":"pending"' +
      '}' +
      '],' +
      '"generatedAt":"ISO8601"' +
      '}. ' +
      'Usa español neutro (tuteo mexicano). Prioriza sugerencias específicas sobre genéricas. Máximo 6 sugerencias.';

    const userPrompt = JSON.stringify({
      task: 'Analizar rendimiento de marketing y generar ajustes de estrategia',
      brandBrief: context.brandBrief,
      metrics: context.metrics,
      campaigns: context.campaigns,
    });

    const result = await this.llm.chatJson<StrategyAnalysisData>(
      systemPrompt,
      userPrompt,
      { taskType: 'strategy_adjustment' },
    );

    if (!result?.summary || !Array.isArray(result.suggestions)) {
      throw new Error('Invalid strategy analysis response from LLM');
    }

    return {
      ...result,
      generatedAt: result.generatedAt ?? new Date().toISOString(),
    };
  }
}