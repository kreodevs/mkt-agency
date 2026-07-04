export interface VideoGenerationResult {
  videoUrl?: string;
  videoBuffer?: Buffer;
  mimeType?: string;
  duration?: number;
}

export interface VideoGenerationOptions {
  duration?: number;
  aspectRatio?: string;
  resolution?: string;
  style?: string;
  generateAudio?: boolean;
}

export interface VideoGenerationAdapterPort {
  generateVideo(prompt: string, options?: VideoGenerationOptions): Promise<VideoGenerationResult>;
}

export const VIDEO_GENERATION_ADAPTER = Symbol('VIDEO_GENERATION_ADAPTER');
