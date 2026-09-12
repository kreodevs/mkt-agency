import { Injectable, Logger } from '@nestjs/common';
import {
  enrichTalkingHeadWithProductMedia,
  type TalkingHeadEnrichResult,
} from './domain/talking-head-video-enrich.util';

@Injectable()
export class TalkingHeadVideoEnricherService {
  private readonly logger = new Logger(TalkingHeadVideoEnricherService.name);

  async enrichWithProductScreenshots(
    talkingHeadVideo: Buffer,
    screenshots: Buffer[],
  ): Promise<{ buffer: Buffer; metadata: TalkingHeadEnrichResult | null }> {
    if (screenshots.length === 0) {
      return { buffer: talkingHeadVideo, metadata: null };
    }

    const result = await enrichTalkingHeadWithProductMedia({
      talkingHeadVideo,
      introScreenshot: screenshots[0],
      pipScreenshot: screenshots[1] ?? screenshots[0],
    });

    if (!result) {
      this.logger.warn(
        'Enriquecimiento de talking-head con media kit omitido (FFmpeg o composición falló)',
      );
      return { buffer: talkingHeadVideo, metadata: null };
    }

    this.logger.log(
      `Talking-head enriquecido: intro ${result.introSeconds}s + PiP de producto`,
    );
    return { buffer: result.buffer, metadata: result };
  }
}
