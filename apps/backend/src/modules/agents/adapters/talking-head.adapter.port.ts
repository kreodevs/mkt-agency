export interface TalkingHeadInput {
  imageUrl: string;
  audioUrl: string;
  resolution?: '720p' | '1080p';
  videoPrompt?: string;
}

export interface TalkingHeadResult {
  videoBuffer: Buffer;
  mimeType: string;
  outputUrl?: string;
}

export interface TalkingHeadAdapterPort {
  generate(input: TalkingHeadInput): Promise<TalkingHeadResult>;
}

export const TALKING_HEAD_ADAPTER = Symbol('TALKING_HEAD_ADAPTER');
