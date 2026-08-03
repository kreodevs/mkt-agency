import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmProviderEntity } from '../../modules/platform/infrastructure/typeorm/llm-provider.entity';

const ENV_PROVIDER_MAP: ReadonlyArray<{ slug: string; envKey: string }> = [
  { slug: 'openrouter', envKey: 'OPENROUTER_API_KEY' },
  { slug: 'replicate', envKey: 'REPLICATE_API_KEY' },
  { slug: 'elevenlabs', envKey: 'ELEVENLABS_API_KEY' },
];

/**
 * Seeds LLM provider API keys from env when DB rows exist but api_key is empty.
 * Enables real OpenRouter/Replicate/ElevenLabs adapters without manual Superadmin step.
 */
@Injectable()
export class LlmProviderBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(LlmProviderBootstrapService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(LlmProviderEntity)
    private readonly providers: Repository<LlmProviderEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const { slug, envKey } of ENV_PROVIDER_MAP) {
      await this.bootstrapProvider(slug, envKey);
    }
  }

  private async bootstrapProvider(slug: string, envKey: string): Promise<void> {
    const apiKey = this.config.get<string>(envKey)?.trim();
    if (!apiKey) return;

    const row = await this.providers.findOne({ where: { slug } });
    if (!row) {
      this.logger.warn(`LLM provider "${slug}" not found — run migrations before ${envKey}`);
      return;
    }
    if (row.apiKey?.trim()) return;

    row.apiKey = apiKey;
    row.isActive = true;
    await this.providers.save(row);
    this.logger.log(`Bootstrapped LLM provider "${slug}" from ${envKey}`);
  }
}
