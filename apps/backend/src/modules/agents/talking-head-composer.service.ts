import { Inject, Injectable, Logger } from '@nestjs/common';
import { AssetService } from '../assets/asset.service';
import { LlmConfigService } from '../../shared/ai/llm-config.service';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { sanitizeSpanishNarrationScript } from './domain/image-generation.utils';
import {
  ReplicateTalkingHeadAdapter,
  StubTalkingHeadAdapter,
} from './adapters/replicate-talking-head.adapter';
import {
  TALKING_HEAD_ADAPTER,
  TalkingHeadAdapterPort,
  TalkingHeadInput,
  TalkingHeadResult,
} from './adapters/talking-head.adapter.port';
import { TtsGenerationService } from './tts-generation.service';

export interface ComposeTalkingHeadOptions {
  portraitAssetId: string;
  script: string;
  voiceId?: string;
  tenantId: string;
  userId?: string;
  contentId?: string;
  productId?: string;
  metadata?: Record<string, unknown>;
}

export interface ComposeTalkingHeadResult {
  videoAssetId: string;
  audioAssetId: string;
  videoUrl: string;
}

@Injectable()
export class TalkingHeadComposerService {
  private readonly logger = new Logger(TalkingHeadComposerService.name);

  constructor(
    private readonly assetService: AssetService,
    private readonly tts: TtsGenerationService,
    private readonly llmConfig: LlmConfigService,
    private readonly llmProviders: LlmProviderService,
    private readonly replicate: ReplicateTalkingHeadAdapter,
    @Inject(TALKING_HEAD_ADAPTER)
    private readonly stub: TalkingHeadAdapterPort,
  ) {}

  async compose(options: ComposeTalkingHeadOptions): Promise<ComposeTalkingHeadResult> {
    const script = sanitizeSpanishNarrationScript(options.script);
    if (!script) {
      throw new Error('El guion de narración está vacío');
    }

    const [portraitUrl, ttsResult] = await Promise.all([
      this.resolveAssetUrl(options.tenantId, options.portraitAssetId),
      this.tts.synthesize({ text: script, voiceId: options.voiceId }),
    ]);

    const audioAsset = await this.uploadBuffer(
      options.tenantId,
      ttsResult.audioBuffer,
      `cm-narracion-${Date.now()}.mp3`,
      ttsResult.mimeType,
      {
        source: 'cm-talking-head',
        kind: 'tts-audio',
        contentId: options.contentId ?? null,
        productId: options.productId ?? null,
        ttsProvider: ttsResult.provider,
        ttsModel: ttsResult.model,
        ...options.metadata,
      },
    );

    const audioUrl = await this.resolveAssetUrl(options.tenantId, audioAsset.id);
    const talkingHead = await this.generateTalkingHead({
      imageUrl: portraitUrl,
      audioUrl,
      resolution: '720p',
    });

    const videoAsset = await this.uploadBuffer(
      options.tenantId,
      talkingHead.videoBuffer,
      `cm-reel-${Date.now()}.mp4`,
      talkingHead.mimeType,
      {
        source: 'cm-talking-head',
        kind: 'talking-head-video',
        contentId: options.contentId ?? null,
        productId: options.productId ?? null,
        portraitAssetId: options.portraitAssetId,
        audioAssetId: audioAsset.id,
        ...options.metadata,
      },
    );

    return {
      videoAssetId: videoAsset.id,
      audioAssetId: audioAsset.id,
      videoUrl: `/api/v1/assets/${videoAsset.id}/file`,
    };
  }

  private async generateTalkingHead(input: TalkingHeadInput): Promise<TalkingHeadResult> {
    const task = (await this.llmConfig.listAll()).find(
      (row) => row.taskType === 'talking_head_generation',
    );
    if (!task?.enabled) {
      return this.stub.generate(input);
    }

    const provider = task.providerId
      ? await this.llmProviders.findEntityById(task.providerId)
      : null;
    if (!provider?.apiKey?.trim() || !provider.isActive) {
      return this.stub.generate(input);
    }

    if (provider.slug === 'replicate') {
      return this.replicate.generate(input);
    }

    return this.stub.generate(input);
  }

  private async resolveAssetUrl(tenantId: string, assetId: string): Promise<string> {
    const signed = await this.assetService.getDownloadUrl(tenantId, assetId);
    return signed.url;
  }

  private async uploadBuffer(
    tenantId: string,
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    metadata: Record<string, unknown>,
  ) {
    const fakeFile: Express.Multer.File = {
      buffer,
      originalname: fileName,
      mimetype: mimeType,
      size: buffer.length,
      fieldname: 'file',
      encoding: '7bit',
      stream: null as unknown as import('stream').Readable,
      destination: '',
      filename: fileName,
      path: '',
    };

    return this.assetService.upload(tenantId, fakeFile, undefined, undefined, metadata);
  }
}
