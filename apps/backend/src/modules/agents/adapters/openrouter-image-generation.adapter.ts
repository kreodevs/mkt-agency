import { Injectable } from '@nestjs/common';
import { LlmConfigService } from '../../../shared/ai/llm-config.service';
import {
  ImageGenerationAdapterPort,
  ImageGenerationResult,
} from './image-generation.adapter.port';

@Injectable()
export class OpenRouterImageGenerationAdapter implements ImageGenerationAdapterPort {
  constructor(private readonly llmConfig: LlmConfigService) {}

  async generateImage(
    prompt: string,
    options?: {
      size?: string;
      style?: string;
    },
  ): Promise<ImageGenerationResult> {
    const resolved = await this.llmConfig.resolve('image_generation');

    const model = resolved.model?.trim() || 'black-forest-labs/flux-2-pro';
    const size = options?.size || '1024x1024';

    const body = {
      model,
      prompt: `${options?.style ? `Style: ${options.style}. ` : ''}${prompt}`,
      n: 1,
      size,
      output_format: 'png',
    };

    const baseUrl = resolved.apiUrl.replace(/\/$/, '');
    const url = baseUrl.includes('/api/v1')
      ? `${baseUrl}/images`
      : `${baseUrl}/api/v1/images`;

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
      data?: Array<{ url?: string; b64_json?: string; media_type?: string }>;
    };

    const item = data.data?.[0];
    if (!item) {
      throw new Error('Image generation returned no data');
    }

    if (item.b64_json) {
      return {
        imageBuffer: Buffer.from(item.b64_json, 'base64'),
        mimeType: item.media_type ?? 'image/png',
      };
    }

    if (item.url) {
      return { imageUrl: item.url };
    }

    throw new Error('Image generation returned no image payload');
  }
}
