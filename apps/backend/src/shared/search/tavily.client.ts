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
    options?: { maxResults?: number; country?: string | null },
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
        search_depth: 'advanced',
        max_results: options?.maxResults ?? 5,
        include_answer: false,
        ...(options?.country ? { country: options.country } : {}),
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.warn(`Tavily search failed (${response.status}): ${body.slice(0, 200)}`);
      throw new BadRequestException({
        error: 'Tavily search request failed',
        code: 'TAVILY_SEARCH_FAILED',
      });
    }

    const parsed = (await response.json()) as TavilyApiResponse;
    return {
      query,
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
    const queries = (context.searchQueries ?? []).filter(Boolean).slice(0, 4);
    if (queries.length === 0) {
      return [];
    }

    const country = resolveTavilyCountry(context);
    const settled = await Promise.allSettled(
      queries.map((query) => this.search(query, { maxResults: 5, country })),
    );

    const evidence: TavilyQueryEvidence[] = [];
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        evidence.push(result.value);
      } else {
        this.logger.warn('Tavily query failed', result.reason);
      }
    }

    return evidence;
  }

  async testConnection(): Promise<{ ok: true; resultCount: number; query: string }> {
    const evidence = await this.search('software marketing automation SaaS', {
      maxResults: 3,
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

  if (country.includes('méxico') || country.includes('mexico') || country === 'mx') {
    return 'mx';
  }
  if (country.includes('españa') || country.includes('spain') || country === 'es') {
    return 'es';
  }
  if (country.includes('colombia') || country === 'co') {
    return 'co';
  }
  if (country.includes('argentina') || country === 'ar') {
    return 'ar';
  }
  if (country.includes('chile') || country === 'cl') {
    return 'cl';
  }
  if (country.includes('estados unidos') || country.includes('usa') || country === 'us') {
    return 'us';
  }

  return null;
}
