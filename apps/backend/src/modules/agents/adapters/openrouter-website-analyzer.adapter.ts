import { Injectable, Logger } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import { fetchPageContent } from '../../../shared/web/page-content.util';
import { WebsiteAnalyzerAdapterPort, WebsiteAnalysisResult } from './website-analyzer.adapter.port';

@Injectable()
export class OpenRouterWebsiteAnalyzerAdapter implements WebsiteAnalyzerAdapterPort {
  private readonly logger = new Logger(OpenRouterWebsiteAnalyzerAdapter.name);

  constructor(private readonly llm: LlmClient) {}

  async analyze(url: string): Promise<WebsiteAnalysisResult> {
    const page = await fetchPageContent(url);

    const systemPrompt =
      'Eres un analista de negocios experto. Analiza el contenido de una página web ' +
      'y extrae información clave de la empresa. Responde SOLO con JSON válido:\n' +
      JSON.stringify({
        companyName: 'nombre de la empresa detectado',
        industry: 'industria/sector (retail, services, health, tech, education, finance, other)',
        website: 'la URL analizada',
        description: 'descripción de 2-3 líneas de lo que hace la empresa',
        targetAudience: 'descripción del público objetivo',
        valueProposition: 'propuesta de valor principal',
        brandVoice: 'tono de marca detectado (profesional, juvenil, serio, divertido, etc.)',
        productsServices: 'principales productos o servicios',
        competitors: 'competidores mencionados o inferidos del contexto',
        marketingObjectives: 'posibles objetivos de marketing inferidos',
        socialMediaChannels: ['redes sociales detectadas'],
        extractedFrom: url,
      });

    const userPrompt = `Analiza el siguiente contenido extraído de ${page.url} y extrae la información de negocio:\n\n${page.text.slice(0, 15000)}`;

    const result = await this.llm.chatJson<WebsiteAnalysisResult>(
      systemPrompt,
      userPrompt,
      { taskType: 'brand_interview' },
    );

    if (!result?.companyName) {
      throw new Error('No se pudo extraer información de negocio de la URL proporcionada');
    }

    return {
      ...result,
      extractedFrom: page.url,
    };
  }
}