import { Module } from '@nestjs/common';
import { LlmModule } from '../../shared/ai/llm.module';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { OpenRouterSuggestionAdapter } from './adapters/openrouter-suggestion.adapter';
import {
  SUGGESTION_ADAPTER,
  SuggestionAdapterPort,
} from './adapters/suggestion.adapter.port';
import { StubSuggestionAdapter } from './adapters/stub-suggestion.adapter';

@Module({
  imports: [LlmModule],
  providers: [
    StubSuggestionAdapter,
    OpenRouterSuggestionAdapter,
    {
      provide: SUGGESTION_ADAPTER,
      useFactory: (
        stub: StubSuggestionAdapter,
        llm: OpenRouterSuggestionAdapter,
        providers: LlmProviderService,
      ): SuggestionAdapterPort => ({
        generate: async (context) => {
          if (await providers.hasActiveConfigured()) {
            return llm.generate(context);
          }
          return stub.generate(context);
        },
      }),
      inject: [StubSuggestionAdapter, OpenRouterSuggestionAdapter, LlmProviderService],
    },
  ],
  exports: [SUGGESTION_ADAPTER],
})
export class AiAgentsModule {}
