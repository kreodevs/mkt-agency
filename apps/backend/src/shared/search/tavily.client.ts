import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PlatformIntegrationService } from '../../modules/platform/services/platform-integration.service';
import type { CompetitorDiscoveryContext } from '../../modules/competitors/adapters/competitor-discovery.adapter.port';

export interface TavilySearchHit {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilyQueryEvidence {
  query: string;
  results: TavilySearchHit[];
  answer?: string | null;
}

interface TavilyApiResult {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
}

interface TavilyApiResponse {
  query?: string;
  results?: TavilyApiResult[];
  answer?: string;
}

const DEFAULT_QUERY_TIMEOUT_MS = 15_000;
const DEFAULT_GATHER_BUDGET_MS = 45_000;
const MAX_DISCOVERY_QUERIES = 5;
const MAX_RESULTS_PER_QUERY = 6;

@Injectable()
export class TavilySearchService {
  private readonly logger = new Logger(TavilySearchService.name);
  private readonly apiUrl = 'https://api.tavily.com/search';

  constructor(private readonly integrations: PlatformIntegrationService) {}

  async isConfigured(): Promise<boolean> {
    return this.integrations.isActiveAndConfigured('tavily');
  }

  async search(
    query: string,
    options?: {
      maxResults?: number;
      country?: string | null;
      timeoutMs?: number;
      searchDepth?: 'basic' | 'advanced' | 'fast';
      includeAnswer?: boolean;
    },
  ): Promise<TavilyQueryEvidence> {
    const apiKey = await this.integrations.getActiveApiKey('tavily');
    if (!apiKey) {
      throw new BadRequestException({
        error: 'Tavily API key is not configured',
        code: 'TAVILY_NOT_CONFIGURED',
      });
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        topic: 'general',
        search_depth: options?.searchDepth ?? 'basic',
        max_results: options?.maxResults ?? MAX_RESULTS_PER_QUERY,
        include_answer: options?.includeAnswer ?? false,
        ...(options?.country ? { country: options.country } : {}),
      }),
      signal: AbortSignal.timeout(options?.timeoutMs ?? DEFAULT_QUERY_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.warn(`Tavily search failed (${response.status}): ${body.slice(0, 200)}`);
      return {
        query,
        results: [],
      };
    }

    const parsed = (await response.json()) as TavilyApiResponse;
    return {
      query,
      answer: parsed.answer?.trim() || null,
      results: (parsed.results ?? [])
        .filter((item) => item.title?.trim() && item.url?.trim())
        .map((item) => ({
          title: item.title!.trim(),
          url: item.url!.trim(),
          content: item.content?.trim() ?? '',
          score: typeof item.score === 'number' ? item.score : 0,
        })),
    };
  }

  async gatherCompetitorEvidence(
    context: CompetitorDiscoveryContext,
  ): Promise<TavilyQueryEvidence[]> {
    const queries = (context.searchQueries ?? []).filter(Boolean).slice(0, MAX_DISCOVERY_QUERIES);
    if (queries.length === 0) {
      return [];
    }

    const country = resolveTavilyCountry(context);
    const deadline = Date.now() + DEFAULT_GATHER_BUDGET_MS;

    const settled = await Promise.allSettled(
      queries.map(async (query, index) => {
        const remaining = deadline - Date.now();
        if (remaining <= 500) {
          return null;
        }

        return this.search(query, {
          maxResults: MAX_RESULTS_PER_QUERY,
          country,
          timeoutMs: Math.min(DEFAULT_QUERY_TIMEOUT_MS, remaining),
          searchDepth: index < 2 ? 'advanced' : 'basic',
          includeAnswer: index === 0,
        });
      }),
    );

    const evidence: TavilyQueryEvidence[] = [];
    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value) {
        evidence.push(result.value);
      } else if (result.status === 'rejected') {
        this.logger.warn('Tavily query failed', result.reason);
      }
    }

    return evidence;
  }

  async testConnection(): Promise<{ ok: true; resultCount: number; query: string }> {
    const evidence = await this.search('software marketing automation SaaS', {
      maxResults: 3,
      searchDepth: 'basic',
    });
    return {
      ok: true,
      resultCount: evidence.results.length,
      query: evidence.query,
    };
  }
}

function resolveTavilyCountry(context: CompetitorDiscoveryContext): string | null {
  const country = (context.country ?? '').trim().toLowerCase();
  if (!country) {
    return null;
  }

  // Tavily expects lowercase English country names (e.g. "mexico"), not ISO codes.
  const aliases: Array<{ pattern: RegExp; value: string }> = [
    { pattern: /\b(m[eé]xico|mexico|mx\b)/i, value: 'mexico' },
    { pattern: /\b(espa[nñ]a|spain|es\b)/i, value: 'spain' },
    { pattern: /\bcolombia|co\b/i, value: 'colombia' },
    { pattern: /\bargentina|ar\b/i, value: 'argentina' },
    { pattern: /\bchile|cl\b/i, value: 'chile' },
    { pattern: /\b(estados unidos|united states|usa|us\b)/i, value: 'united states' },
  ];

  for (const { pattern, value } of aliases) {
    if (pattern.test(country)) {
      return value;
    }
  }

  return null;
}
