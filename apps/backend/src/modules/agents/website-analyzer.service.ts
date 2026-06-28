import { Injectable, Logger } from '@nestjs/common';
import { LlmClient } from '../../shared/ai/llm.client';

export interface WebsiteAnalysisResult {
  companyName: string;
  industry: string;
  website: string;
  description: string;
  targetAudience: string;
  valueProposition: string;
  brandVoice: string;
  productsServices: string;
  competitors: string;
  marketingObjectives: string;
  socialMediaChannels: string[];
  extractedFrom: string;
}

@Injectable()
export class WebsiteAnalyzerService {
  private readonly logger = new Logger(WebsiteAnalyzerService.name);

  constructor(private readonly llm: LlmClient) {}

  async analyze(url: string): Promise<WebsiteAnalysisResult> {
    this.logger.log(`Analyzing website: ${url}`);
    const pageContent = await this.fetchPage(url);

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

    const userPrompt = `Analiza el siguiente contenido extraído de ${url} y extrae la información de negocio:\n\n${pageContent.slice(0, 15000)}`;

    const result = await this.llm.chatJson<WebsiteAnalysisResult>(
      systemPrompt,
      userPrompt,
      { taskType: 'brand_interview' },
    );

    if (!result?.companyName) {
      throw new Error('Could not extract business information from the provided URL');
    }

    return {
      ...result,
      extractedFrom: url,
    };
  }

  private async fetchPage(url: string): Promise<string> {
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;

    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; MktAgencyBot/1.0; +https://mkt-agency.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text.slice(0, 20000);
  }
}