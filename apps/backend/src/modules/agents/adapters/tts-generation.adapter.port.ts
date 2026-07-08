export interface TtsGenerationInput {
  text: string;
  voiceId?: string;
}

export interface TtsGenerationResult {
  audioBuffer: Buffer;
  mimeType: string;
  provider: 'elevenlabs' | 'openrouter';
  model: string;
}

export interface TtsGenerationAdapterPort {
  synthesize(input: TtsGenerationInput): Promise<TtsGenerationResult>;
}

export const TTS_GENERATION_ADAPTER = Symbol('TTS_GENERATION_ADAPTER');
