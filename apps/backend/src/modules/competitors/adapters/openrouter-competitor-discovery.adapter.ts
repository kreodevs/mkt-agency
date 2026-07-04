import { Injectable, Logger } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import { TavilySearchService } from '../../../shared/search/tavily.client';
import { isRetailBusiness, extractWebSearchCandidates, competitorsFromWebEvidence } from '../domain/competitor-discovery-context.util';
import {
  CompetitorDiscoveryAdapterPort,
  CompetitorDiscoveryContext,
  DiscoveredCompetitorResult,
} from './competitor-discovery.adapter.port';

interface DiscoveryJsonResponse {
  competitors?: Array<{
    name?: string;
    website?: string | null;
    industry?: string | null;
    rationale?: string | null;
    confidence?: 'high' | 'medium' | 'low' | string | null;
  }>;
}

@Injectable()
export class OpenRouterCompetitorDiscoveryAdapter implements CompetitorDiscoveryAdapterPort {
  private readonly logger = new Logger(OpenRouterCompetitorDiscoveryAdapter.name);

  constructor(
    private readonly llm: LlmClient,
    private readonly tavily: TavilySearchService,
  ) {}

  async discover(context: CompetitorDiscoveryContext): Promise<DiscoveredCompetitorResult[]> {
    const scopeLabel =
      context.scope === 'global'
        ? 'mercado global'
        : context.scope === 'country'
          ? `país: ${context.country}`
          : `ciudad: ${context.city}, ${context.country}`;

    const retail = isRetailBusiness(context);
    const excludeNames = [
      ...(context.existingCompetitorNames ?? []),
      ...(context.knownCompetitorNames ?? []),
    ];

    let webSearchEvidence: Array<{
      query: string;
      answer?: string | null;
      hits: Array<{ title: string; url: string; snippet: string }>;
    }> = [];
    let tavilySynthesis: string | null = null;

    if (await this.tavily.isConfigured()) {
      try {
        const evidence = await this.tavily.gatherCompetitorEvidence(context);
        webSearchEvidence = evidence.map((entry) => ({
          query: entry.query,
          answer: entry.answer ?? null,
          hits: entry.results.slice(0, 6).map((hit) => ({
            title: hit.title,
            url: hit.url,
            snippet: hit.content.slice(0, 280),
          })),
        }));
        tavilySynthesis =
          evidence.find((entry) => entry.answer?.trim())?.answer?.trim() ?? null;
      } catch (error) {
        this.logger.warn('Tavily enrichment failed, continuing with LLM-only discovery', error);
      }
    }

    const usingWebSearch = webSearchEvidence.length > 0;
    const candidateNamesFromWeb = extractWebSearchCandidates(webSearchEvidence);

    const systemPrompt =
      'Eres un analista senior de inteligencia competitiva para PYMEs en Latinoamérica. ' +
      'Tu trabajo es identificar empresas REALES que compiten DIRECTAMENTE con el producto descrito. ' +
      (usingWebSearch
        ? 'Combina webSearchEvidence, candidateNamesFromWeb y tavilySynthesis con tu conocimiento del sector para maximizar recall sin inventar placeholders. '
        : 'Usa productKeywords y searchQueries como consultas de búsqueda reales. ') +
      'No confundas alcance geográfico con sector: un país no implica supermercados ni retail masivo salvo que la empresa sea retail. ' +
      'No inventes marcas genéricas ni placeholders. Si no conoces el dominio con certeza, usa null en website. ' +
      'Responde SOLO con JSON válido en español, sin markdown.';

    const userPrompt = JSON.stringify({
      task: `Identifica entre 8 y 12 competidores directos reales para el alcance: ${scopeLabel}.`,
      methodology: [
        usingWebSearch
          ? '1. Extrae empresas de webSearchEvidence, candidateNamesFromWeb y tavilySynthesis.'
          : '1. Interpreta productKeywords y searchQueries como consultas de búsqueda reales.',
        '2. Determina la categoría exacta del producto (qué vende, a quién, en qué rango de precio).',
        '3. Lista empresas que un cliente evaluaría como alternativa directa en una comparativa de compra.',
        '4. Prioriza players activos en el alcance geográfico sin cambiar de vertical.',
        '5. Excluye marketplaces genéricos, retailers masivos y la propia empresa.',
        usingWebSearch
          ? '6. Si la evidencia web es escasa, complementa con players reales del rubro en la geografía indicada (confidence=medium).'
          : '6. Marca confidence=low si el nombre es incierto; preferible omitir empresas dudosas.',
      ],
      companyProfile: {
        companyName: context.companyName,
        industryCode: context.industry,
        industryLabel: context.industryLabel,
        website: context.website,
        targetAudience: context.targetAudience,
        brandVoice: context.brandVoice,
        objectives: context.objectives ?? [],
        productOrServiceSummary: context.productSummary,
        productName: context.productName,
        brandBriefExcerpt: context.brandBriefExcerpt,
      },
      productSignals: {
        keywords: context.productKeywords ?? [],
        category: context.productCategory,
        priceRange: context.productPriceRange,
        website: context.productWebsiteUrl,
        searchQueries: context.searchQueries ?? [],
      },
      webSearchEvidence,
      candidateNamesFromWeb,
      tavilySynthesis,
      strictRules: [
        'Competidor = alternativa real que un cliente consideraría en lugar de este producto.',
        'Misma categoría de producto/servicio, problema resuelto y audiencia similar.',
        retail
          ? 'La empresa ES de retail/ecommerce de consumo: puedes incluir retailers del sector.'
          : 'PROHIBIDO sugerir supermercados, tiendas departamentales, marketplaces genéricos (Walmart, Liverpool, Mercado Libre, Amazon, Chedraui, etc.) salvo que la empresa vende lo mismo.',
        'No repitas empresas en excludeNames.',
        'website: dominio verificable sin https, o null si no estás seguro.',
        'rationale: explica el solapamiento concreto de producto/servicio en 1-2 frases.',
        'Incluye mix de líderes del sector y alternativas nicho/regional cuando aplique.',
        'Prioriza recall útil: es mejor listar un competidor regional con confidence=medium que omitirlo.',
      ],
      excludeNames,
      outputFormat: {
        competitors: [
          {
            name: 'Nombre comercial real',
            website: 'dominio.com o null',
            industry: 'sector específico del competidor',
            rationale: 'Por qué compite en el mismo rubro (1-2 frases concretas)',
            confidence: 'high | medium | low',
          },
        ],
      },
    });

    const parsed = await this.llm.chatJson<DiscoveryJsonResponse>(systemPrompt, userPrompt, {
      taskType: 'competitor_discovery',
      temperature: usingWebSearch ? 0.25 : 0.3,
      maxTokens: 4000,
    });

    const llmItems = this.mapLlmCompetitors(parsed);
    if (llmItems.length >= 2) {
      return llmItems;
    }

    if (usingWebSearch) {
      const webItems = competitorsFromWebEvidence(
        webSearchEvidence.map((entry) => ({
          query: entry.query,
          hits: entry.hits.map((hit) => ({
            title: hit.title,
            url: hit.url,
            snippet: hit.snippet,
          })),
        })),
      );
      if (webItems.length > 0) {
        this.logger.warn(
          `LLM returned ${llmItems.length} competitors; supplementing with ${webItems.length} Tavily candidates`,
        );
        return this.mergeDiscoveredCompetitors(llmItems, webItems);
      }
    }

    return llmItems;
  }

  private mapLlmCompetitors(parsed: DiscoveryJsonResponse): DiscoveredCompetitorResult[] {
    const mapped = (parsed.competitors ?? [])
      .filter((item) => item.name?.trim())
      .map((item) => ({
        name: item.name!.trim(),
        website: item.website?.trim() || null,
        industry: item.industry?.trim() || null,
        rationale: item.rationale?.trim() || null,
        confidence: (item.confidence ?? 'medium').toString().toLowerCase(),
      }));

    const preferred = mapped.filter((item) => item.confidence !== 'low');
    const selected = preferred.length >= 2 ? preferred : mapped;

    return selected.map(({ name, website, industry, rationale }) => ({
      name,
      website,
      industry,
      rationale,
    }));
  }

  private mergeDiscoveredCompetitors(
    primary: DiscoveredCompetitorResult[],
    secondary: DiscoveredCompetitorResult[],
  ): DiscoveredCompetitorResult[] {
    const seen = new Set(primary.map((item) => item.name.trim().toLowerCase()));
    const merged = [...primary];

    for (const item of secondary) {
      const key = item.name.trim().toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      merged.push(item);
      if (merged.length >= 12) {
        break;
      }
    }

    return merged;
  }
}
