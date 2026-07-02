import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { LlmConfigService } from './llm-config.service';
import { LlmProviderService } from './llm-provider.service';
import { LlmUsageService } from './llm-usage.service';
import { isLlmRetryableWithFallback } from './llm-fallback.util';
import type { ResolvedLlmExecutionConfig } from './llm-task-types';
import type { LlmTaskType } from './llm-task-types';

interface ChatCompletionUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: ChatCompletionUsage;
}

export interface LlmChatOptions {
  taskType?: LlmTaskType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tenantId?: string | null;
  userId?: string | null;
}

@Injectable()
export class LlmClient {
  private readonly logger = new Logger(LlmClient.name);

  constructor(
    private readonly llmConfig: LlmConfigService,
    private readonly llmProviders: LlmProviderService,
    private readonly llmUsage: LlmUsageService,
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

    const primaryModel = options.model ?? resolved.model;
    const modelsToTry = this.buildModelAttempts(primaryModel, resolved.fallbackModel);

    let lastError: Error | null = null;

    for (let index = 0; index < modelsToTry.length; index += 1) {
      const model = modelsToTry[index];
      const isFallbackAttempt = index > 0;

      try {
        if (isFallbackAttempt) {
          this.logger.warn(
            `Retrying LLM task ${resolved.taskType} with fallback model ${model} (primary: ${primaryModel})`,
          );
        }

        return await this.requestChatJson<T>({
          resolved,
          systemPrompt,
          userPrompt,
          model,
          temperature: options.temperature ?? resolved.temperature ?? 0.7,
          maxTokens: options.maxTokens ?? resolved.maxTokens,
          taskType: options.taskType,
          tenantId: options.tenantId,
          userId: options.userId,
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const hasNextModel = index < modelsToTry.length - 1;

        if (!hasNextModel || !this.shouldRetryWithFallback(lastError)) {
          throw lastError;
        }
      }
    }

    throw lastError ?? new Error('LLM request failed');
  }

  private buildModelAttempts(primaryModel: string, fallbackModel?: string | null): string[] {
    const attempts = [primaryModel.trim()];
    const fallback = fallbackModel?.trim();

    if (fallback && fallback !== attempts[0]) {
      attempts.push(fallback);
    }

    return attempts;
  }

  private shouldRetryWithFallback(error: Error): boolean {
    const match = error.message.match(/^LLM request failed \((\d+)\):([\s\S]*)$/);
    if (!match) {
      return false;
    }

    const status = Number(match[1]);
    const body = match[2] ?? '';
    return isLlmRetryableWithFallback(status, body);
  }

  private async requestChatJson<T>(params: {
    resolved: ResolvedLlmExecutionConfig;
    systemPrompt: string;
    userPrompt: string;
    model: string;
    temperature: number;
    maxTokens?: number;
    taskType: LlmTaskType;
    tenantId?: string | null;
    userId?: string | null;
  }): Promise<T> {
    const {
      resolved,
      systemPrompt,
      userPrompt,
      model,
      temperature,
      maxTokens,
      taskType,
      tenantId,
      userId,
    } = params;
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

    this.llmUsage.record({
      tenantId,
      userId,
      taskType,
      providerId: resolved.providerId,
      model,
      modality: 'chat',
      promptTokens: payload.usage?.prompt_tokens ?? 0,
      completionTokens: payload.usage?.completion_tokens ?? 0,
      totalTokens: payload.usage?.total_tokens ?? 0,
      status: 'success',
    });

    return JSON.parse(content) as T;
  }
}
