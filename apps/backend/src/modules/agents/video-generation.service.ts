import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetService } from '../assets/asset.service';
import { LlmConfigService } from '../../shared/ai/llm-config.service';
import { estimateVideoCostUsd } from '../../shared/ai/llm-usage-cost.util';
import { LlmUsageService } from '../../shared/ai/llm-usage.service';
import { AgentImageGenerationEntity } from './domain/agent-image-generation.entity';
import {
  buildVideoGenerationPrompt,
  estimateSpeechDurationSeconds,
  fitNarrationBodyForDuration,
  formatGenerationError,
  isImageGenerationMetadata,
  resolveVideoAspectRatio,
  resolveVideoDuration,
  resolveVideoDurationPolicy,
  splitNarrationIntoSegments,
  sanitizeSpanishNarrationScript,
  shouldGenerateVideoAudio,
  type ImageGenerationMetadata,
} from './domain/image-generation.utils';
import {
  FFMPEG_UNAVAILABLE_MESSAGE,
  isFfmpegAvailable,
  resolveFfmpegPath,
} from './domain/video-ffmpeg.util';
import {
  VIDEO_GENERATION_ADAPTER,
  VideoGenerationAdapterPort,
  VideoGenerationResult,
} from './adapters/video-generation.adapter.port';
import { ContentService } from '../content/content.service';
import { type GenerateImageResult } from './image-generation.service';

@Injectable()
export class VideoGenerationService {
  private readonly logger = new Logger(VideoGenerationService.name);

  constructor(
    @InjectRepository(AgentImageGenerationEntity)
    private readonly generations: Repository<AgentImageGenerationEntity>,
    @Inject(VIDEO_GENERATION_ADAPTER)
    private readonly videoAdapter: VideoGenerationAdapterPort,
    private readonly assetService: AssetService,
    private readonly contentService: ContentService,
    private readonly llmConfig: LlmConfigService,
    private readonly llmUsage: LlmUsageService,
  ) {}

  async runVideoGeneration(
    tenantId: string,
    userId: string,
    record: AgentImageGenerationEntity,
    prompt: string,
    options: { contentId?: string; style?: string },
  ): Promise<GenerateImageResult> {
    try {
      const content = options.contentId
        ? await this.contentService.findOne(tenantId, options.contentId)
        : null;

      const videoResolved = await this.llmConfig.resolve('video_generation');
      const videoModel = videoResolved.model?.trim() || 'bytedance/seedance-2.0-fast';
      const durationPolicy = resolveVideoDurationPolicy(videoModel);

      const rawNarration = content?.currentVersion?.body;
      const sanitizedNarration = rawNarration?.trim() ? sanitizeSpanishNarrationScript(rawNarration) : '';

      const maxCombinedDuration = 22;
      const needsSegmentation = durationPolicy.truncateNarration && sanitizedNarration
        && estimateSpeechDurationSeconds(sanitizedNarration) > durationPolicy.maxDuration;

      if (needsSegmentation && sanitizedNarration && await isFfmpegAvailable()) {
        return this.runSegmentedVideoGeneration(
          tenantId, userId, record, prompt, sanitizedNarration, maxCombinedDuration,
        );
      }
      if (needsSegmentation) {
        this.logger.warn(
          'FFmpeg no disponible; omitiendo segmentación y usando un solo clip truncado',
        );
      }

      let narrationBody = rawNarration;
      let narrationTruncated = false;

      if (durationPolicy.truncateNarration && rawNarration?.trim()) {
        narrationTruncated =
          estimateSpeechDurationSeconds(sanitizedNarration) > durationPolicy.maxDuration;
        narrationBody = fitNarrationBodyForDuration(rawNarration, durationPolicy.maxDuration);
      }

      const duration = resolveVideoDuration(prompt, narrationBody, durationPolicy);
      const videoPrompt = buildVideoGenerationPrompt({
        basePrompt: prompt,
        title: content?.title,
        narrationBody,
        durationSeconds: duration,
        narrationTruncated,
      });

      const result = await this.videoAdapter.generateVideo(videoPrompt, {
        duration,
        aspectRatio: resolveVideoAspectRatio(prompt),
        resolution: '720p',
        style: options.style,
        generateAudio: shouldGenerateVideoAudio(prompt, narrationBody),
      });

      const asset = await this.uploadGeneratedVideo(tenantId, prompt, result);

      const metadata: ImageGenerationMetadata = {
        mediaType: 'video',
        intendedMediaType: 'video',
        mimeType: result.mimeType ?? 'video/mp4',
        duration,
        frameCount: 1,
        frames: [{ assetId: asset.id, index: 0 }],
      };

      record.imageUrl = `/api/v1/assets/${asset.id}/file`;
      record.assetId = asset.id;
      record.metadata = metadata;
      record.status = 'completed';
      record.errorMessage = null;
      await this.generations.save(record);

      if (options.contentId) {
        await this.attachAssetsToContent(tenantId, userId, options.contentId, [asset.id], 'video');
      }

      await this.recordMediaUsage({
        tenantId, userId,
        taskType: 'video_generation', modality: 'video',
        metadata: { duration, generationId: record.id },
        estimatedCostUsd: estimateVideoCostUsd(duration),
      });

      return this.toResult(record);
    } catch (error) {
      this.logger.warn(`Video generation failed: ${error instanceof Error ? error.message : error}`);
      record.status = 'failed';
      record.errorMessage = formatGenerationError(error);
      record.metadata = isImageGenerationMetadata(record.metadata)
        ? { ...record.metadata, mediaType: 'video', frameCount: 0, frames: [] }
        : { intendedMediaType: 'video', mediaType: 'video', frameCount: 0, frames: [] };
      await this.generations.save(record);
      return this.toResult(record);
    }
  }

  async runSegmentedVideoGeneration(
    tenantId: string,
    userId: string,
    record: AgentImageGenerationEntity,
    prompt: string,
    narrationBody: string,
    segmentDuration: number,
  ): Promise<GenerateImageResult> {
    if (!(await isFfmpegAvailable())) {
      throw new Error(FFMPEG_UNAVAILABLE_MESSAGE);
    }

    const segments = splitNarrationIntoSegments(narrationBody, segmentDuration);
    this.logger.log(`Split narration into ${segments.length} segments for segmented video generation`);

    const clipPromises = segments.map(async (seg) => {
      const videoPrompt = buildVideoGenerationPrompt({
        basePrompt: prompt,
        narrationBody: seg.body,
        durationSeconds: Math.min(seg.durationSeconds, segmentDuration),
      });

      return this.videoAdapter.generateVideo(videoPrompt, {
        duration: Math.min(seg.durationSeconds, segmentDuration),
        aspectRatio: resolveVideoAspectRatio(prompt),
        resolution: '720p',
        generateAudio: true,
      });
    });

    const clipResults = await Promise.all(clipPromises);
    const concatenatedVideo = await this.concatVideoClips(clipResults);
    const asset = await this.uploadGeneratedVideo(tenantId, prompt, concatenatedVideo);

    const metadata: ImageGenerationMetadata = {
      mediaType: 'video',
      intendedMediaType: 'video',
      mimeType: 'video/mp4',
      duration: clipResults.reduce((sum, r) => sum + (r.duration || 0), 0) || 0,
      frameCount: 1,
      frames: [{ assetId: asset.id, index: 0 }],
    };

    record.imageUrl = `/api/v1/assets/${asset.id}/file`;
    record.assetId = asset.id;
    record.metadata = metadata;
    record.status = 'completed';
    record.errorMessage = null;
    await this.generations.save(record);

    if (record.contentId) {
      await this.attachAssetsToContent(tenantId, userId, record.contentId, [asset.id], 'video');
    }

    await this.recordMediaUsage({
      tenantId, userId,
      taskType: 'video_generation', modality: 'video',
      metadata: { duration: metadata.duration, generationId: record.id, segmented: true },
      estimatedCostUsd: estimateVideoCostUsd(Math.max(1, metadata.duration || 0)),
    });

    return this.toResult(record);
  }

  async concatVideoClips(results: VideoGenerationResult[]): Promise<VideoGenerationResult> {
    if (results.length === 1) {
      return results[0];
    }

    const ffmpegPath = await resolveFfmpegPath();
    if (!ffmpegPath) {
      throw new Error(FFMPEG_UNAVAILABLE_MESSAGE);
    }

    const tempDir = '/tmp/video-clips-' + Date.now();
    fs.mkdirSync(tempDir, { recursive: true });
    const crossfadeDuration = 0.5;

    try {
      for (let i = 0; i < results.length; i++) {
        const buffer = await this.resolveClipBuffer(results[i]);
        if (!buffer) continue;
        await fs.promises.writeFile(path.join(tempDir, `clip_${i}.mp4`), buffer);
      }

      const clipDurations = results.map(r => r.duration || 15);
      const videoInputs = results.map((_, i) => `[${i}:v]setpts=PTS-STARTPTS[v${i}];`).join('');
      const audioInputs = results.map((_, i) => `[${i}:a]asetpts=PTS-STARTPTS[a${i}];`).join('');

      let videoFilter = '';
      let offset = clipDurations[0] - crossfadeDuration;
      for (let i = 0; i < results.length - 1; i++) {
        videoFilter += `[v${i}][v${i + 1}]xfade=transition=fade:duration=${crossfadeDuration}:offset=${offset}[v${i + 1}];`;
        offset += clipDurations[i + 1] - crossfadeDuration;
      }

      const audioConcat = results.map((_, i) => `[a${i}]`).join('');
      const audioFilter = `${audioConcat}concat=n=${results.length}:v=0:a=1[a]`;

      const filterComplex = `${videoInputs}${audioInputs}${videoFilter}[v${results.length - 1}]format=yuv420p[vv];${audioFilter}`;

      await new Promise<void>((resolve, reject) => {
        const inputFiles = results.map((_, i) => `-i ${tempDir}/clip_${i}.mp4`).join(' ');
        exec(
          `"${ffmpegPath}" ${inputFiles} -filter_complex "${filterComplex}" -map "[vv]" -map "[a]" ${tempDir}/output.mp4 -y`,
          (error, stdout, stderr) => {
            if (error) {
              this.logger.error(`FFmpeg concat error: ${stderr || error.message}`);
              return reject(new Error(`FFmpeg concatenation failed: ${stderr || error.message}`));
            }
            resolve();
          },
        );
      });

      const outputBuffer = await fs.promises.readFile(path.join(tempDir, 'output.mp4'));

      return {
        videoBuffer: outputBuffer,
        mimeType: 'video/mp4',
        duration: results.reduce((sum, r) => sum + (r.duration || 0), 0) - (crossfadeDuration * (results.length - 1)),
      };
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  }

  private async resolveClipBuffer(
    result: VideoGenerationResult,
  ): Promise<Buffer | null> {
    if (result.videoBuffer) return result.videoBuffer;
    if (!result.videoUrl) return null;
    const response = await fetch(result.videoUrl);
    return Buffer.from(new Uint8Array(await response.arrayBuffer()));
  }

  async uploadGeneratedVideo(
    tenantId: string,
    prompt: string,
    result: VideoGenerationResult,
  ) {
    const { buffer, contentType } = await this.resolveVideoPayload(result);
    const slug = prompt.slice(0, 32).replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${slug || 'video'}.mp4`;

    const fakeFile: Express.Multer.File = {
      buffer,
      originalname: fileName,
      mimetype: contentType,
      size: buffer.length,
      fieldname: 'file',
      encoding: '7bit',
      stream: null as unknown as import('stream').Readable,
      destination: '',
      filename: fileName,
      path: '',
    };

    return this.assetService.upload(tenantId, fakeFile);
  }

  async resolveVideoPayload(
    result: VideoGenerationResult,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    if (result.videoBuffer?.length) {
      return {
        buffer: result.videoBuffer,
        contentType: result.mimeType ?? 'video/mp4',
      };
    }

    if (result.videoUrl) {
      const videoResponse = await fetch(result.videoUrl);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download generated video: ${videoResponse.status}`);
      }

      return {
        buffer: Buffer.from(await videoResponse.arrayBuffer()),
        contentType: videoResponse.headers.get('content-type') || 'video/mp4',
      };
    }

    throw new Error('Video adapter returned no video data');
  }

  private async attachAssetsToContent(
    tenantId: string,
    userId: string,
    contentId: string,
    assetIds: string[],
    mediaType: 'image' | 'video' = 'image',
  ): Promise<void> {
    const changeSummary =
      mediaType === 'video'
        ? 'Video generado por Image Generator'
        : assetIds.length > 1
          ? `Secuencia de ${assetIds.length} imágenes generada por Image Generator`
          : 'Imagen generada por Image Generator';

    await this.contentService.update(tenantId, userId, contentId, {
      assets: assetIds,
      changeSummary,
    });
  }

  private toResult(record: AgentImageGenerationEntity): GenerateImageResult {
    return {
      id: record.id,
      tenantId: record.tenantId,
      prompt: record.prompt,
      assetId: record.assetId,
      imageUrl: record.imageUrl,
      status: record.status,
      contentId: record.contentId,
      productId: record.productId,
      errorMessage: record.errorMessage,
      metadata: isImageGenerationMetadata(record.metadata) ? record.metadata : undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private async recordMediaUsage(params: {
    tenantId: string;
    userId: string;
    taskType: 'image_generation' | 'video_generation';
    modality: 'image' | 'video';
    metadata?: Record<string, unknown>;
    estimatedCostUsd?: number;
  }): Promise<void> {
    try {
      const resolved = await this.llmConfig.resolve(params.taskType);
      this.llmUsage.record({
        tenantId: params.tenantId,
        userId: params.userId,
        taskType: params.taskType,
        providerId: resolved.providerId,
        model: resolved.model,
        modality: params.modality,
        estimatedCostUsd: params.estimatedCostUsd,
        metadata: params.metadata,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to record ${params.modality} usage: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
