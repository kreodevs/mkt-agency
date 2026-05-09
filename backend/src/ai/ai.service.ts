import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('AI_API_URL', 'https://openrouter.ai/api/v1');
    this.apiKey = this.configService.get<string>('AI_API_KEY', '');
    this.model = this.configService.get<string>('AI_MODEL', 'deepseek/deepseek-v4-flash');

    if (!this.apiKey) {
      this.logger.warn('AI_API_KEY no configurada — AI Service no disponible');
    } else {
      this.logger.log(`AI Service inicializado: ${this.model} @ ${this.baseUrl.split('/').slice(0, 3).join('/')}...`);
    }
  }

  get configured(): boolean {
    return !!this.apiKey;
  }

  get currentModel(): string {
    return this.model;
  }

  async chat(
    messages: AiChatMessage[],
    options: AiCompletionOptions = {},
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('AI_API_KEY no está configurada');
    }

    const body: Record<string, any> = {
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    };

    if (options.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const url = `${this.baseUrl.replace(/\/+$/, '')}/chat/completions`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...(this.baseUrl.includes('openrouter.ai') ? { 'HTTP-Referer': 'https://mkt-agency.kreoint.mx', 'X-Title': 'MarketingOS' } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`AI API error ${response.status}: ${errorText.slice(0, 200)}`);
      }

      const data: any = await response.json();
      return data.choices?.[0]?.message?.content?.trim() ?? '';
    } catch (err: any) {
      this.logger.error(`Error en chat completion: ${err.message}`);
      throw err;
    }
  }

  async generatePost(tenantId: string, productName: string, topic?: string): Promise<string> {
    const systemPrompt = `Eres un copywriter experto en marketing para SaaS B2B. 
Genera un post corto para X/Twitter (máx 280 caracteres) sobre ${productName}.
Usa un tono profesional pero cercano. Incluye 1-2 hashtags relevantes.
NO uses emojis excesivos. Responde SOLO con el texto del post, sin explicaciones.`;

    const userPrompt = topic
      ? `Genera un post sobre: ${topic}`
      : `Genera un post promocional para ${productName}`;

    return this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.8, maxTokens: 200 });
  }

  async scoreLead(leadInfo: { name: string; clinic?: string; source?: string; painPoints?: string[] }): Promise<{ score: number; rationale: string }> {
    const prompt = `Eres un sistema de scoring de leads para un CRM de salud dental.
Analiza el siguiente lead y devuelve un JSON con "score" (0-100) y "rationale" (explicación breve en español).

Lead:
- Nombre: ${leadInfo.name}
- Clínica: ${leadInfo.clinic || 'No especificada'}
- Fuente: ${leadInfo.source || 'Desconocida'}
- Pain Points: ${leadInfo.painPoints?.join(', ') || 'No especificados'}

Reglas de scoring:
- Si tiene clínica +20
- Si la fuente es "google_ads" +15
- Si tiene pain points relevantes +10-30
- Si es de "prospeccion" -10 (más frío)

Responde SOLO con el JSON, sin markdown ni explicaciones extra.`;

    const result = await this.chat([
      { role: 'system', content: 'Eres un sistema de scoring de leads. Responde siempre en JSON.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.3, maxTokens: 300, jsonMode: true });

    try {
      return JSON.parse(result);
    } catch {
      return { score: 50, rationale: 'Error al analizar — score por defecto' };
    }
  }

  async optimizeCampaign(campaignInfo: { name: string; description?: string; keywords?: string[] }): Promise<{ suggestions: string[] }> {
    const prompt = `Eres un experto en Google Ads para clínicas dentales.
Analiza esta campaña y sugiere optimizaciones:

Campaña: ${campaignInfo.name}
${campaignInfo.description ? `Descripción: ${campaignInfo.description}` : ''}
${campaignInfo.keywords ? `Keywords actuales: ${campaignInfo.keywords.join(', ')}` : ''}

Responde SOLO con un JSON: { "suggestions": ["sugerencia 1", "sugerencia 2", ...] }
Máximo 5 sugerencias, en español.`;

    const result = await this.chat([
      { role: 'system', content: 'Eres un experto en Google Ads. Responde siempre en JSON.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.5, maxTokens: 500, jsonMode: true });

    try {
      return JSON.parse(result);
    } catch {
      return { suggestions: ['No se pudieron generar sugerencias'] };
    }
  }
}
