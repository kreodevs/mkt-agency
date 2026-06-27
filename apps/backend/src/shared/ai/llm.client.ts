import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { LlmConfigService } from './llm-config.service';
import { LlmProviderService } from './llm-provider.service';
import type { LlmTaskType } from './llm-task-types';

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export interface LlmChatOptions {
  taskType?: LlmTaskType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class LlmClient {
  constructor(
    private readonly llmConfig: LlmConfigService,
    private readonly llmProviders: LlmProviderService,
  ) {}

  async isConfigured(): Promise<boolean> {
    return this.llmProviders.hasActiveConfigured();
  }

  async chatJson<T>(
    systemPrompt: string,
    userPrompt: string,
    options?: LlmChatOptions,
  ): Promise<T> {
    if (!options?.taskType) {
      throw new Error('taskType is required for LLM requests');
    }

    const resolved = await this.llmConfig.resolve(options.taskType);

    if (!resolved.enabled) {
      throw new ServiceUnavailableException({
        error: 'LLM task is disabled by platform configuration',
        code: 'LLM_TASK_DISABLED',
        taskType: resolved.taskType,
      });
    }

    const model = options.model ?? resolved.model;
    const temperature = options.temperature ?? resolved.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? resolved.maxTokens;
    const effectiveSystemPrompt =
      resolved.systemPromptTemplate?.trim() || systemPrompt;

    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: effectiveSystemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature,
    };

    if (maxTokens) {
      body.max_tokens = maxTokens;
    }

    const response = await fetch(`${resolved.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolved.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`LLM request failed (${response.status}): ${errorBody}`);
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('LLM returned an empty response');
    }

    return JSON.parse(content) as T;
  }
}
