import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LlmModule } from '../../shared/ai/llm.module';
import { OpenRouterSuggestionAdapter } from './adapters/openrouter-suggestion.adapter';
import {
  SUGGESTION_ADAPTER,
  SuggestionAdapterPort,
} from './adapters/suggestion.adapter.port';
import { StubSuggestionAdapter } from './adapters/stub-suggestion.adapter';

@Module({
  imports: [ConfigModule, LlmModule],
  providers: [
    StubSuggestionAdapter,
    OpenRouterSuggestionAdapter,
    {
      provide: SUGGESTION_ADAPTER,
      useFactory: (
        config: ConfigService,
        stub: StubSuggestionAdapter,
        llm: OpenRouterSuggestionAdapter,
      ): SuggestionAdapterPort => {
        return config.get<string>('AI_API_KEY') ? llm : stub;
      },
      inject: [ConfigService, StubSuggestionAdapter, OpenRouterSuggestionAdapter],
    },
  ],
  exports: [SUGGESTION_ADAPTER],
})
export class AiAgentsModule {}
