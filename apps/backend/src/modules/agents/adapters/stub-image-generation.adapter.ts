import { Injectable } from '@nestjs/common';
import { ImageGenerationAdapterPort } from './image-generation.adapter.port';

@Injectable()
export class StubImageGenerationAdapter implements ImageGenerationAdapterPort {
  async generateImage(prompt: string, _options?: { size?: string; style?: string }): Promise<{ imageUrl: string; localPath?: string }> {
    return {
      imageUrl: `https://placehold.co/1024x1024/6366f1/ffffff?text=${encodeURIComponent(prompt.slice(0, 30))}`,
    };
  }
}