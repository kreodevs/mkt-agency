import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmProviderEntity } from '../../platform/infrastructure/typeorm/llm-provider.entity';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly defaultModel = 'openai/text-embedding-3-small';

  constructor(
    @InjectRepository(LlmProviderEntity)
    private readonly providers: Repository<LlmProviderEntity>,
  ) {}

  async embed(text: string): Promise<number[] | null> {
    const provider = await this.resolveProvider();
    if (!provider?.apiKey?.trim()) {
      return null;
    }

    const apiUrl = provider.apiUrl.replace(/\/$/, '');
    const input = text.trim().slice(0, 8000);
    if (!input) {
      return null;
    }

    try {
      const response = await fetch(`${apiUrl}/embeddings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${provider.apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.defaultModel,
          input,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.warn(`Embedding API failed (${response.status}): ${body.slice(0, 200)}`);
        return null;
      }

      const payload = (await response.json()) as {
        data?: Array<{ embedding?: number[] }>;
      };
      const embedding = payload.data?.[0]?.embedding;
      return Array.isArray(embedding) && embedding.length > 0 ? embedding : null;
    } catch (error) {
      this.logger.warn('Embedding request failed', error);
      return null;
    }
  }

  private async resolveProvider(): Promise<LlmProviderEntity | null> {
    const active = await this.providers.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    return active.find((row) => row.slug === 'openrouter') ?? active[0] ?? null;
  }
}
