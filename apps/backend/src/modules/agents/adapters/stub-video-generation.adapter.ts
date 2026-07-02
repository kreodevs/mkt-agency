import { Injectable } from '@nestjs/common';
import {
  VideoGenerationAdapterPort,
  VideoGenerationResult,
} from './video-generation.adapter.port';

const STUB_VIDEO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

@Injectable()
export class StubVideoGenerationAdapter implements VideoGenerationAdapterPort {
  async generateVideo(
    _prompt: string,
    _options?: { duration?: number; aspectRatio?: string; resolution?: string; style?: string; generateAudio?: boolean },
  ): Promise<VideoGenerationResult> {
    return { videoUrl: STUB_VIDEO_URL, mimeType: 'video/mp4' };
  }
}
