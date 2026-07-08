import { Inject, Injectable, Logger } from '@nestjs/common';
import { LlmConfigService } from '../../shared/ai/llm-config.service';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import {
  ElevenLabsTtsAdapter,
  OpenRouterTtsAdapter,
  StubTtsAdapter,
} from './adapters/tts-generation.adapters';
import {
  TTS_GENERATION_ADAPTER,
  TtsGenerationAdapterPort,
  TtsGenerationInput,
  TtsGenerationResult,
} from './adapters/tts-generation.adapter.port';

@Injectable()
export class TtsGenerationService {
  private readonly logger = new Logger(TtsGenerationService.name);

  constructor(
    private readonly llmConfig: LlmConfigService,
    private readonly llmProviders: LlmProviderService,
    private readonly elevenLabs: ElevenLabsTtsAdapter,
    private readonly openRouter: OpenRouterTtsAdapter,
    @Inject(TTS_GENERATION_ADAPTER)
    private readonly stub: TtsGenerationAdapterPort,
  ) {}

  async synthesize(input: TtsGenerationInput): Promise<TtsGenerationResult> {
    const task = (await this.llmConfig.listAll()).find((row) => row.taskType === 'tts_generation');
    if (!task?.enabled) {
      return this.stub.synthesize(input);
    }

    const primary = await this.resolvePrimaryAdapter(task.providerId);
    try {
      return await primary.synthesize(input);
    } catch (primaryError) {
      this.logger.warn('Primary TTS failed, trying OpenRouter fallback', primaryError);
      if (primary === this.openRouter) {
        throw primaryError;
      }
      return this.openRouter.synthesize(input);
    }
  }

  private async resolvePrimaryAdapter(
    providerId: string | null,
  ): Promise<TtsGenerationAdapterPort> {
    if (!providerId) {
      return this.stub;
    }

    const provider = await this.llmProviders.findEntityById(providerId);
    if (!provider?.apiKey?.trim() || !provider.isActive) {
      return this.stub;
    }

    if (provider.slug === 'elevenlabs') {
      return this.elevenLabs;
    }

    if (provider.slug === 'openrouter') {
      return this.openRouter;
    }

    return this.elevenLabs;
  }
}
