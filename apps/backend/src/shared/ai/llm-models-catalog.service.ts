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
  architecture?: {
    output_modalities?: string[];
  };
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

interface OpenRouterImageModelRow {
  id?: string;
  name?: string;
  architecture?: {
    output_modalities?: string[];
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
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    };

    const [chatModels, imageModels] = await Promise.all([
      this.fetchChatModels(baseUrl, headers),
      this.fetchImageModels(baseUrl, headers),
    ]);

    const byId = new Map<string, LlmModelOption>();
    for (const model of chatModels) {
      byId.set(model.id, model);
    }

    for (const model of imageModels) {
      const existing = byId.get(model.id);
      if (existing) {
        byId.set(model.id, {
          ...existing,
          source: 'image',
          outputModalities: this.mergeModalities(
            existing.outputModalities,
            model.outputModalities,
          ),
        });
      } else {
        byId.set(model.id, model);
      }
    }

    const models = Array.from(byId.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es'),
    );

    if (!models.length) {
      throw new ServiceUnavailableException({
        error: 'Provider returned no models',
        code: 'LLM_MODELS_EMPTY',
      });
    }

    return models;
  }

  private async fetchChatModels(
    baseUrl: string,
    headers: Record<string, string>,
  ): Promise<LlmModelOption[]> {
    const modelsUrl = `${baseUrl}/models`;
    const response = await fetch(modelsUrl, { headers });

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

    return (payload.data ?? [])
      .map((row) => this.normalizeChatRow(row))
      .filter((row): row is LlmModelOption => Boolean(row?.id));
  }

  private async fetchImageModels(
    baseUrl: string,
    headers: Record<string, string>,
  ): Promise<LlmModelOption[]> {
    const imageModelsUrl = baseUrl.includes('/api/v1')
      ? `${baseUrl}/images/models`
      : `${baseUrl}/api/v1/images/models`;

    try {
      const response = await fetch(imageModelsUrl, { headers });
      if (!response.ok) {
        return [];
      }

      const payload = (await response.json()) as {
        data?: OpenRouterImageModelRow[];
      };

      return (payload.data ?? [])
        .map((row) => this.normalizeImageRow(row))
        .filter((row): row is LlmModelOption => Boolean(row?.id));
    } catch {
      return [];
    }
  }

  private normalizeChatRow(
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
      source: 'chat',
      outputModalities: openRouter.architecture?.output_modalities ?? undefined,
    };
  }

  private normalizeImageRow(row: OpenRouterImageModelRow): LlmModelOption | null {
    const id = row.id?.trim();
    if (!id) {
      return null;
    }

    return {
      id,
      name: row.name?.trim() || id,
      inputCostPer1M: null,
      outputCostPer1M: null,
      contextLength: null,
      source: 'image',
      outputModalities: row.architecture?.output_modalities ?? ['image'],
    };
  }

  private mergeModalities(
    left?: string[],
    right?: string[],
  ): string[] | undefined {
    const merged = new Set([...(left ?? []), ...(right ?? [])]);
    return merged.size ? Array.from(merged) : undefined;
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
