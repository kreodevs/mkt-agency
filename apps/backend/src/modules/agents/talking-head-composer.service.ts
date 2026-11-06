import { Inject, Injectable, Logger } from '@nestjs/common';
import { AssetService } from '../assets/asset.service';
import { LlmConfigService } from '../../shared/ai/llm-config.service';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { fitNarrationBodyForDuration } from './domain/video-narration.utils';
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
import { TalkingHeadVideoEnricherService } from './talking-head-video-enricher.service';
import { VideoBrandingService } from './video-branding.service';

export interface ComposeTalkingHeadOptions {
  portraitAssetId: string;
  script: string;
  voiceId?: string;
  tenantId: string;
  userId?: string;
  accessUser?: { id: string; tenantId: string; email?: string; role?: string };
  contentId?: string;
  productId?: string;
  metadata?: Record<string, unknown>;
  /** Capturas del media kit para intro + PiP en el reel. */
  productScreenshotBuffers?: Buffer[];
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
    private readonly videoEnricher: TalkingHeadVideoEnricherService,
    private readonly videoBranding: VideoBrandingService,
    @Inject(TALKING_HEAD_ADAPTER)
    private readonly stub: TalkingHeadAdapterPort,
  ) {}

  async compose(options: ComposeTalkingHeadOptions): Promise<ComposeTalkingHeadResult> {
    const script = fitNarrationBodyForDuration(options.script, 25);
    if (!script) {
      throw new Error('El guion de narración está vacío');
    }

    const [portraitUrl, ttsResult, portraitFile] = await Promise.all([
      this.resolveAssetUrl(options.tenantId, options.portraitAssetId, options.accessUser),
      this.tts.synthesize({ text: script, voiceId: options.voiceId }),
      this.assetService.readFile(options.tenantId, options.portraitAssetId).catch(() => null),
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

    const audioUrl = await this.resolveAssetUrl(
      options.tenantId,
      audioAsset.id,
      options.accessUser,
    );

    const isLocalOrPrivate = (url: string) =>
      !url.startsWith('https://') ||
      url.includes('localhost') ||
      url.includes('127.0.0.1') ||
      url.includes('0.0.0.0');

    const effectiveImageUrl =
      portraitFile?.buffer && isLocalOrPrivate(portraitUrl)
        ? `data:${portraitFile.mimeType || 'image/png'};base64,${portraitFile.buffer.toString('base64')}`
        : portraitUrl;

    const effectiveAudioUrl =
      isLocalOrPrivate(audioUrl)
        ? `data:${ttsResult.mimeType || 'audio/mp3'};base64,${ttsResult.audioBuffer.toString('base64')}`
        : audioUrl;

    const talkingHead = await this.generateTalkingHead({
      imageUrl: effectiveImageUrl,
      audioUrl: effectiveAudioUrl,
      resolution: '720p',
    });

    const enriched = await this.videoEnricher.enrichWithProductScreenshots(
      talkingHead.videoBuffer,
      options.productScreenshotBuffers ?? [],
    );

    let finalVideo = enriched.buffer;
    if (options.productId) {
      finalVideo = await this.videoBranding.applyProductLogoToVideo(
        options.tenantId,
        options.productId,
        finalVideo,
      );
    }

    const videoAsset = await this.uploadBuffer(
      options.tenantId,
      finalVideo,
      `cm-reel-${Date.now()}.mp4`,
      talkingHead.mimeType,
      {
        source: 'cm-talking-head',
        kind: 'talking-head-video',
        contentId: options.contentId ?? null,
        productId: options.productId ?? null,
        portraitAssetId: options.portraitAssetId,
        audioAssetId: audioAsset.id,
        mediaKitEnriched: Boolean(enriched.metadata),
        mediaKitIntroSeconds: enriched.metadata?.introSeconds ?? null,
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

  private async resolveAssetUrl(
    tenantId: string,
    assetId: string,
    accessUser?: ComposeTalkingHeadOptions['accessUser'],
  ): Promise<string> {
    if (accessUser) {
      return this.assetService.getExternalFileUrl(tenantId, assetId);
    }
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
