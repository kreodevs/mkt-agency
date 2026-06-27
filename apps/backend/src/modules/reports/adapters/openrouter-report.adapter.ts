import { Injectable } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import { REPORT_TYPE_LABELS } from '../domain/report.constants';
import {
  GeneratedReportData,
  ReportAdapterPort,
  ReportGenerationContext,
} from './report.adapter.port';

@Injectable()
export class OpenRouterReportAdapter implements ReportAdapterPort {
  constructor(private readonly llm: LlmClient) {}

  async generate(context: ReportGenerationContext): Promise<GeneratedReportData> {
    const systemPrompt =
      'Eres un analista de marketing digital. Responde SOLO con JSON válido: ' +
      '{"summary":"...","highlights":["..."],"metrics":{"key":number|string},"recommendations":["..."],"generatedAt":"ISO8601"}. ' +
      'Usa español neutro. Basa el análisis en los datos proporcionados.';

    const userPrompt = JSON.stringify({
      task: `Generar reporte ${REPORT_TYPE_LABELS[context.type]}`,
      type: context.type,
      config: context.config,
      metrics: context.metrics,
      campaign: context.campaign,
    });

    const result = await this.llm.chatJson<GeneratedReportData>(
      systemPrompt,
      userPrompt,
      { taskType: 'report_generation' },
    );

    if (!result?.summary || !Array.isArray(result.recommendations)) {
      throw new Error('Invalid report response from LLM');
    }

    return {
      ...result,
      generatedAt: result.generatedAt ?? new Date().toISOString(),
    };
  }
}
