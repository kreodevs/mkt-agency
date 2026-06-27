import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { LlmProviderService } from './llm-provider.service';
import type { LlmModelOption, LlmModelsListResponse } from './llm-models.types';

interface OpenRouterModelRow {
  id?: string;
  name?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

interface OpenAiModelRow {
  id?: string;
}

const CACHE_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class LlmModelsCatalogService {
  private readonly cache = new Map<
    string,
    { expiresAt: number; models: LlmModelOption[] }
  >();

  constructor(private readonly providerService: LlmProviderService) {}

  async listForProvider(providerId: string): Promise<LlmModelsListResponse> {
    const cached = this.cache.get(providerId);
    if (cached && cached.expiresAt > Date.now()) {
      const provider = await this.providerService.findById(providerId);
      return {
        providerId,
        providerName: provider.name,
        models: cached.models,
      };
    }

    const entity = await this.providerService.findEntityById(providerId);
    if (!entity) {
      throw new BadRequestException({
        error: 'LLM provider not found',
        code: 'NOT_FOUND',
      });
    }
    if (!entity.apiKey?.trim()) {
      throw new BadRequestException({
        error: 'Configure API key before listing models',
        code: 'LLM_API_KEY_MISSING',
      });
    }

    const models = await this.fetchModels(entity.apiUrl, entity.apiKey.trim());
    this.cache.set(providerId, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      models,
    });

    return {
      providerId: entity.id,
      providerName: entity.name,
      models,
    };
  }

  invalidateProvider(providerId: string): void {
    this.cache.delete(providerId);
  }

  private async fetchModels(
    apiUrl: string,
    apiKey: string,
  ): Promise<LlmModelOption[]> {
    const baseUrl = apiUrl.replace(/\/$/, '');
    const modelsUrl = `${baseUrl}/models`;

    const response = await fetch(modelsUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new ServiceUnavailableException({
        error: 'Failed to fetch models from provider',
        code: 'LLM_MODELS_FETCH_FAILED',
        status: response.status,
        details: body.slice(0, 200),
      });
    }

    const payload = (await response.json()) as {
      data?: OpenRouterModelRow[] | OpenAiModelRow[];
    };

    const rows = payload.data ?? [];
    const models = rows
      .map((row) => this.normalizeRow(row))
      .filter((row): row is LlmModelOption => Boolean(row?.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));

    if (!models.length) {
      throw new ServiceUnavailableException({
        error: 'Provider returned no models',
        code: 'LLM_MODELS_EMPTY',
      });
    }

    return models;
  }

  private normalizeRow(
    row: OpenRouterModelRow | OpenAiModelRow,
  ): LlmModelOption | null {
    const id = row.id?.trim();
    if (!id) {
      return null;
    }

    const openRouter = row as OpenRouterModelRow;
    const prompt = openRouter.pricing?.prompt;
    const completion = openRouter.pricing?.completion;

    return {
      id,
      name: openRouter.name?.trim() || id,
      inputCostPer1M: this.tokenPriceToPer1M(prompt),
      outputCostPer1M: this.tokenPriceToPer1M(completion),
      contextLength: openRouter.context_length ?? null,
    };
  }

  private tokenPriceToPer1M(price?: string): number | null {
    if (price === undefined || price === null || price === '') {
      return null;
    }
    const perToken = Number(price);
    if (!Number.isFinite(perToken)) {
      return null;
    }
    return perToken * 1_000_000;
  }
}
