import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmConfigService } from './llm-config.service';
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
    private readonly config: ConfigService,
    private readonly llmConfig: LlmConfigService,
  ) {}

  get isConfigured(): boolean {
    return Boolean(this.config.get<string>('AI_API_KEY'));
  }

  async chatJson<T>(
    systemPrompt: string,
    userPrompt: string,
    options?: LlmChatOptions,
  ): Promise<T> {
    const apiKey = this.config.get<string>('AI_API_KEY');
    if (!apiKey) {
      throw new Error('AI_API_KEY is not configured');
    }

    const resolved = options?.taskType
      ? await this.llmConfig.resolve(options.taskType)
      : null;

    if (resolved && !resolved.enabled) {
      throw new ServiceUnavailableException({
        error: 'LLM task is disabled by platform configuration',
        code: 'LLM_TASK_DISABLED',
        taskType: resolved.taskType,
      });
    }

    const baseUrl = this.config
      .get<string>('AI_API_URL', 'https://openrouter.ai/api/v1')
      .replace(/\/$/, '');
    const model =
      options?.model ??
      resolved?.model ??
      this.config.get<string>('AI_MODEL', 'deepseek/deepseek-v4-flash');
    const temperature =
      options?.temperature ?? resolved?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? resolved?.maxTokens;

    const effectiveSystemPrompt =
      resolved?.systemPromptTemplate?.trim() || systemPrompt;

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

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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
