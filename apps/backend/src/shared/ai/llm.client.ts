import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

@Injectable()
export class LlmClient {
  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return Boolean(this.config.get<string>('AI_API_KEY'));
  }

  async chatJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    const apiKey = this.config.get<string>('AI_API_KEY');
    if (!apiKey) {
      throw new Error('AI_API_KEY is not configured');
    }

    const baseUrl = this.config
      .get<string>('AI_API_URL', 'https://openrouter.ai/api/v1')
      .replace(/\/$/, '');
    const model = this.config.get<string>(
      'AI_MODEL',
      'deepseek/deepseek-v4-flash',
    );

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`LLM request failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('LLM returned an empty response');
    }

    return JSON.parse(content) as T;
  }
}
