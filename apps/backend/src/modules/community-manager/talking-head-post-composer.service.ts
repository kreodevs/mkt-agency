import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TalkingHeadComposerService } from '../agents/talking-head-composer.service';
import { AgentImageGenerationEntity } from '../agents/domain/agent-image-generation.entity';
import { ContentService } from '../content/content.service';
import { normalizeContentVisualFormat } from '../content/domain/content-visual-format.util';
import { sanitizePublishableCopy } from '../../shared/domain/sanitize-publishable-copy.util';
import type { SocialCopyPost } from './adapters/social-copy.adapter.port';
import { CmCharacterService } from './cm-character.service';
import { DEFAULT_CM_VOICE_ID } from './domain/cm-character.constants';

@Injectable()
export class TalkingHeadPostComposerService {
  private readonly logger = new Logger(TalkingHeadPostComposerService.name);

  constructor(
    private readonly cmCharacter: CmCharacterService,
    private readonly talkingHeadComposer: TalkingHeadComposerService,
    private readonly contentService: ContentService,
    @InjectRepository(AgentImageGenerationEntity)
    private readonly generations: Repository<AgentImageGenerationEntity>,
  ) {}

  async attachToContent(
    tenantId: string,
    userId: string,
    contentId: string,
    post: Pick<SocialCopyPost, 'body' | 'visualFormat' | 'cmCharacterId'>,
    productId: string,
  ): Promise<boolean> {
    if (normalizeContentVisualFormat(post.visualFormat) !== 'talking-head') {
      return false;
    }

    const config = await this.cmCharacter.assertReadyForTalkingHead(
      tenantId,
      productId,
      post.cmCharacterId,
    );
    const content = await this.contentService.findOne(tenantId, contentId);
    const script = sanitizePublishableCopy(post.body || content.currentVersion?.body || '');
    if (!script.trim()) {
      return false;
    }

    const record = await this.generations.save(
      this.generations.create({
        tenantId,
        prompt: script.slice(0, 500),
        status: 'processing',
        productId,
        contentId,
        metadata: {
          mediaType: 'video',
          pipeline: 'talking-head',
          frameCount: 1,
          frames: [],
        },
      }),
    );

    try {
      const composed = await this.talkingHeadComposer.compose({
        tenantId,
        productId,
        contentId,
        portraitAssetId: config.portraitAssetId!,
        script,
        voiceId: config.voiceId ?? DEFAULT_CM_VOICE_ID,
        accessUser: { id: userId, tenantId },
        metadata: {
          source: 'copilot-week',
          generationId: record.id,
          cmCharacterId: config.id,
          cmCharacterName: config.name,
        },
      });

      record.status = 'completed';
      record.assetId = composed.videoAssetId;
      record.imageUrl = composed.videoUrl;
      record.metadata = {
        mediaType: 'video',
        pipeline: 'talking-head',
        frameCount: 1,
        frames: [{ assetId: composed.videoAssetId, index: 0 }],
        audioAssetId: composed.audioAssetId,
      };
      await this.generations.save(record);

      await this.contentService.update(tenantId, userId, contentId, {
        assets: [composed.videoAssetId],
        changeSummary: 'Reel con CM virtual (retrato + lip-sync)',
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Talking-head failed';
      record.status = 'failed';
      record.errorMessage = message;
      await this.generations.save(record);
      this.logger.warn(`Talking-head attach failed for content ${contentId}`, error);
      return false;
    }
  }
}
