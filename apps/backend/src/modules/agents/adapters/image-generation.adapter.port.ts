export interface ImageGenerationResult {
  imageUrl?: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  localPath?: string;
}

export interface ImageGenerationAdapterPort {
  generateImage(prompt: string, options?: {
    size?: string;
    style?: string;
  }): Promise<ImageGenerationResult>;
}

export const IMAGE_GENERATION_ADAPTER = Symbol('IMAGE_GENERATION_ADAPTER');