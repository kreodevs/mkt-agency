import type { LlmTaskType } from '../../../shared/ai/llm-task-types';

export interface ImageGenerationResult {
  imageUrl?: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  localPath?: string;
}

export interface ImageGenerationAdapterPort {
  generateImage(
    prompt: string,
    options?: {
      size?: string;
      style?: string;
      taskType?: LlmTaskType;
    },
  ): Promise<ImageGenerationResult>;
}

export const IMAGE_GENERATION_ADAPTER = Symbol('IMAGE_GENERATION_ADAPTER');