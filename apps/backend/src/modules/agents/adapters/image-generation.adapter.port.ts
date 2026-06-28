export interface ImageGenerationAdapterPort {
  generateImage(prompt: string, options?: {
    size?: string;
    style?: string;
  }): Promise<{ imageUrl: string; localPath?: string }>;
}

export const IMAGE_GENERATION_ADAPTER = Symbol('IMAGE_GENERATION_ADAPTER');