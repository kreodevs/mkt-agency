export interface ElevenLabsVoiceOption {
  id: string;
  name: string;
  category?: string;
  gender?: string | null;
  accent?: string | null;
  previewUrl?: string | null;
}

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
