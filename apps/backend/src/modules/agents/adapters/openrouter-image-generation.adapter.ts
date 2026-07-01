import { Injectable, Logger } from '@nestjs/common';
import { LlmConfigService } from '../../../shared/ai/llm-config.service';
import { ImageGenerationAdapterPort } from './image-generation.adapter.port';

@Injectable()
export class OpenRouterImageGenerationAdapter implements ImageGenerationAdapterPort {
  private readonly logger = new Logger(OpenRouterImageGenerationAdapter.name);

  constructor(private readonly llmConfig: LlmConfigService) {}

  async generateImage(prompt: string, options?: {
    size?: string;
    style?: string;
  }): Promise<{ imageUrl: string; localPath?: string }> {
    const resolved = await this.llmConfig.resolve('image_generation');

    const model = resolved.model?.trim() || 'black-forest-labs/flux-1.1-pro';
    const size = options?.size || '1024x1024';

    const body = {
      model,
      prompt: `${options?.style ? `Style: ${options.style}. ` : ''}${prompt}`,
      n: 1,
      size,
    };

    const baseUrl = resolved.apiUrl.replace(/\/$/, '');
    // OpenRouter image endpoint is at /api/v1/images/generations
    // The stored apiUrl may be "https://openrouter.ai" without the /api/v1 path,
    // so we ensure the correct path for image generation.
    const url = baseUrl.includes('/api/v1')
      ? `${baseUrl}/images/generations`
      : `${baseUrl}/api/v1/images/generations`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolved.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Image generation failed (${response.status}): ${err}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
    };

    const imageUrl = data.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('Image generation returned no URL');
    }

    return { imageUrl };
  }
}