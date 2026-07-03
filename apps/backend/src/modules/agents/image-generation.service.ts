import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetService } from '../assets/asset.service';
import { LlmConfigService } from '../../shared/ai/llm-config.service';
import { estimateVideoCostUsd } from '../../shared/ai/llm-usage-cost.util';
import { runWithLlmUsageContext } from '../../shared/ai/llm-usage.context';
import { LlmUsageService } from '../../shared/ai/llm-usage.service';
import {
  IMAGE_GENERATION_ADAPTER,
  ImageGenerationAdapterPort,
  ImageGenerationResult,
} from './adapters/image-generation.adapter.port';
import { AgentImageGenerationEntity } from './domain/agent-image-generation.entity';
import { buildBrandedImagePrompt } from './domain/image-branding.util';
import {
  buildFramePrompt,
  buildVideoGenerationPrompt,
  detectGenerationMediaType,
  detectReelFrameCount,
  isImageGenerationMetadata,
  resolveVideoAspectRatio,
  resolveVideoDuration,
  shouldGenerateVideoAudio,
  type ImageGenerationFrameMeta,
  type ImageGenerationMetadata,
} from './domain/image-generation.utils';
import { ContentService } from '../content/content.service';
import { ProductService } from '../product/product.service';
import {
  getProductLogoAssetId,
} from '../product/domain/product-logo.metadata.util';
import { ImageBrandingService } from './image-branding.service';
import {
  VIDEO_GENERATION_ADAPTER,
  VideoGenerationAdapterPort,
  VideoGenerationResult,
} from './adapters/video-generation.adapter.port';
import {
  resolveImageSizeForPlatform,
  resolveImageStyleForPlatform,
} from '../../shared/social/image-destination-formats.util';
import {
  ImageGenerationJobData,
  ImageGenerationWorkerService,
} from './workers/image-generation.worker';

export interface GenerateImageOptions {
  style?: string;
  size?: string;
  productId?: string;
  contentId?: string;
  background?: boolean;
}

export interface GenerateImageResult {
  id: string;
  tenantId: string;
  prompt: string;
  assetId: string | null;
  imageUrl: string | null;
  status: string;
  contentId: string | null;
  productId: string | null;
  errorMessage: string | null;
  metadata?: ImageGenerationMetadata;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ImageGenerationService {
  private readonly logger = new Logger(ImageGenerationService.name);

  constructor(
    @InjectRepository(AgentImageGenerationEntity)
    private readonly generations: Repository<AgentImageGenerationEntity>,
    @Inject(IMAGE_GENERATION_ADAPTER)
    private readonly adapter: ImageGenerationAdapterPort,
    @Inject(VIDEO_GENERATION_ADAPTER)
    private readonly videoAdapter: VideoGenerationAdapterPort,
    private readonly assetService: AssetService,
    private readonly contentService: ContentService,
    private readonly productService: ProductService,
    private readonly imageBranding: ImageBrandingService,
    private readonly llmConfig: LlmConfigService,
    private readonly llmUsage: LlmUsageService,
    @Inject(forwardRef(() => ImageGenerationWorkerService))
    private readonly imageWorker: ImageGenerationWorkerService,
  ) {}

  async generate(
    tenantId: string,
    userId: string,
    prompt: string,
    options: GenerateImageOptions = {},
  ): Promise<GenerateImageResult> {
    const trimmed = prompt.trim();
    if (!trimmed) {
      throw new BadRequestException({ error: 'Prompt is required', code: 'VALIDATION_ERROR' });
    }

    const record = await this.generations.save(
      this.generations.create({
        tenantId,
        prompt: trimmed,
        status: 'processing',
        productId: options.productId ?? null,
        contentId: options.contentId ?? null,
        metadata: {},
      }),
    );

    if (options.background) {
      this.imageWorker.enqueue({
        generationId: record.id,
        tenantId,
        userId,
        size: options.size,
        style: options.style,
      });
      return this.toResult(record);
    }

    return runWithLlmUsageContext({ tenantId, userId }, () =>
      this.runGeneration(tenantId, userId, record, trimmed, options),
    );
  }

  async processQueuedGeneration(data: ImageGenerationJobData): Promise<void> {
    const record = await this.findOne(data.tenantId, data.generationId);
    if (!record || record.status !== 'processing') {
      return;
    }

    await runWithLlmUsageContext({ tenantId: data.tenantId, userId: data.userId }, () =>
      this.runGeneration(data.tenantId, data.userId, record, record.prompt, {
        contentId: record.contentId ?? undefined,
        productId: record.productId ?? undefined,
        size: data.size,
        style: data.style,
      }),
    );
  }

  async attachVisualToContent(
    tenantId: string,
    userId: string,
    contentId: string,
    visualDescription: string,
    productId?: string,
  ): Promise<GenerateImageResult | null> {
    if (!visualDescription.trim()) {
      return null;
    }

    const content = await this.contentService.findOne(tenantId, contentId);
    const effectiveProductId = productId ?? content.productId ?? undefined;
    const size = resolveImageSizeForPlatform(content.platform);
    const style = resolveImageStyleForPlatform(content.platform);

    return this.generate(
      tenantId,
      userId,
      await this.buildPromptForProduct(tenantId, visualDescription, effectiveProductId),
      {
        contentId,
        productId: effectiveProductId,
        size,
        style,
        background: true,
      },
    );
  }

  private async buildContentBrandedPrompt(
    tenantId: string,
    title: string,
    body: string,
    productId?: string,
  ): Promise<string> {
    const branding = await this.resolveProductBranding(tenantId, productId);
    return buildBrandedImagePrompt({
      productName: branding.productName,
      title,
      body,
      hasLogo: !!branding.logoAssetId,
    });
  }

  private async buildPromptForProduct(
    tenantId: string,
    visualDescription: string,
    productId?: string,
  ): Promise<string> {
    const branding = await this.resolveProductBranding(tenantId, productId);
    return buildBrandedImagePrompt({
      productName: branding.productName,
      visualDescription,
      hasLogo: !!branding.logoAssetId,
    });
  }

  private async resolveProductBranding(
    tenantId: string,
    productId?: string,
  ): Promise<{ productName: string; logoAssetId: string | null }> {
    if (!productId) {
      return { productName: 'Marca', logoAssetId: null };
    }

    try {
      const product = await this.productService.findOwnedEntity(tenantId, productId);
      return {
        productName: product.name,
        logoAssetId: getProductLogoAssetId(product.metadata),
      };
    } catch {
      return { productName: 'Marca', logoAssetId: null };
    }
  }

  private async runGeneration(
    tenantId: string,
    userId: string,
    record: AgentImageGenerationEntity,
    prompt: string,
    options: GenerateImageOptions,
  ): Promise<GenerateImageResult> {
    if (detectGenerationMediaType(prompt) === 'video') {
      return this.runVideoGeneration(tenantId, userId, record, prompt, options);
    }

    return this.runImageGeneration(tenantId, userId, record, prompt, options);
  }

  private async runVideoGeneration(
    tenantId: string,
    userId: string,
    record: AgentImageGenerationEntity,
    prompt: string,
    options: GenerateImageOptions,
  ): Promise<GenerateImageResult> {
    try {
      const content = options.contentId
        ? await this.contentService.findOne(tenantId, options.contentId)
        : null;
      
      const narrationBody = content?.currentVersion?.body;
      const videoPrompt = buildVideoGenerationPrompt({
        basePrompt: prompt,
        title: content?.title,
        narrationBody,
      });

      const duration = resolveVideoDuration(prompt);
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
        tenantId,
        userId,
        taskType: 'video_generation',
        modality: 'video',
        metadata: { duration, generationId: record.id },
        estimatedCostUsd: estimateVideoCostUsd(duration),
      });

      return this.toResult(record);
    } catch (error) {
      this.logger.warn(`Video generation failed: ${error instanceof Error ? error.message : error}`);
      record.status = 'failed';
      record.errorMessage = error instanceof Error ? error.message : 'Video generation failed';
      record.metadata = {};
      await this.generations.save(record);
      return this.toResult(record);
    }
  }

  private async runImageGeneration(
    tenantId: string,
    userId: string,
    record: AgentImageGenerationEntity,
    prompt: string,
    options: GenerateImageOptions,
  ): Promise<GenerateImageResult> {
    const productId = await this.resolveEffectiveProductId(tenantId, options, record);

    if (productId && record.productId !== productId) {
      record.productId = productId;
      await this.generations.save(record);
    }

    try {
      const frameCount = detectReelFrameCount(prompt);
      const frames: ImageGenerationFrameMeta[] = [];

      for (let index = 0; index < frameCount; index += 1) {
        const framePrompt = buildFramePrompt(prompt, index, frameCount);
        const result = await this.adapter.generateImage(framePrompt, {
          size: options.size,
          style: options.style,
        });

        const asset = await this.uploadGeneratedImage(
          tenantId,
          prompt,
          index,
          frameCount,
          result,
          productId,
        );
        frames.push({ assetId: asset.id, index });
      }

      const primary = frames[0];
      const metadata: ImageGenerationMetadata = {
        mediaType: 'image',
        frameCount,
        frames,
      };

      record.imageUrl = primary ? `/api/v1/assets/${primary.assetId}/file` : null;
      record.assetId = primary?.assetId ?? null;
      record.metadata = metadata;
      record.status = 'completed';
      record.errorMessage = null;
      await this.generations.save(record);

      if (options.contentId && frames.length) {
        await this.attachAssetsToContent(
          tenantId,
          userId,
          options.contentId,
          frames.map((frame) => frame.assetId),
          'image',
        );
      }

      await this.recordMediaUsage({
        tenantId,
        userId,
        taskType: 'image_generation',
        modality: 'image',
        metadata: { frameCount, generationId: record.id },
      });

      return this.toResult(record);
    } catch (error) {
      this.logger.warn(`Image generation failed: ${error instanceof Error ? error.message : error}`);
      record.status = 'failed';
      record.errorMessage = error instanceof Error ? error.message : 'Generation failed';
      record.metadata = {};
      await this.generations.save(record);
      return this.toResult(record);
    }
  }

  private async uploadGeneratedImage(
    tenantId: string,
    prompt: string,
    index: number,
    frameCount: number,
    result: ImageGenerationResult,
    productId?: string,
  ) {
    const { buffer: imageBuffer, contentType } = await this.resolveImagePayload(result);
    let finalBuffer = imageBuffer;

    if (productId) {
      const branding = await this.resolveProductBranding(tenantId, productId);
      if (branding.logoAssetId) {
        try {
          finalBuffer = await this.imageBranding.applyProductLogo(
            tenantId,
            imageBuffer,
            branding.logoAssetId,
          );
        } catch (error) {
          this.logger.error(
            `Logo overlay failed for product ${productId} (asset ${branding.logoAssetId}): ${
              error instanceof Error ? error.message : error
            }`,
          );
        }
      } else {
        this.logger.warn(`Product ${productId} has no logoAssetId; skipping overlay`);
      }
    }

    const extension = contentType.split('/').pop() || 'png';
    const slug = prompt.slice(0, 32).replace(/[^a-zA-Z0-9]/g, '_');
    const suffix = frameCount > 1 ? `_frame${index + 1}` : '';
    const fileName = `${slug}${suffix}.${extension}`;

    const fakeFile: Express.Multer.File = {
      buffer: finalBuffer,
      originalname: fileName,
      mimetype: finalBuffer === imageBuffer ? contentType : 'image/png',
      size: finalBuffer.length,
      fieldname: 'file',
      encoding: '7bit',
      stream: null as unknown as import('stream').Readable,
      destination: '',
      filename: fileName,
      path: '',
    };

    return this.assetService.upload(tenantId, fakeFile);
  }

  private async resolveEffectiveProductId(
    tenantId: string,
    options: GenerateImageOptions,
    record: AgentImageGenerationEntity,
  ): Promise<string | undefined> {
    if (options.productId) {
      return options.productId;
    }

    if (record.productId) {
      return record.productId;
    }

    const contentId = options.contentId ?? record.contentId;
    if (!contentId) {
      return undefined;
    }

    try {
      const content = await this.contentService.findOne(tenantId, contentId);
      return content.productId ?? undefined;
    } catch {
      return undefined;
    }
  }

  private async uploadGeneratedVideo(
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

  private async resolveVideoPayload(
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

  private async resolveImagePayload(
    result: ImageGenerationResult,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    if (result.imageBuffer?.length) {
      return {
        buffer: result.imageBuffer,
        contentType: result.mimeType ?? 'image/png',
      };
    }

    if (result.imageUrl) {
      const imageResponse = await fetch(result.imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download generated image: ${imageResponse.status}`);
      }

      return {
        buffer: Buffer.from(await imageResponse.arrayBuffer()),
        contentType: imageResponse.headers.get('content-type') || 'image/png',
      };
    }

    throw new Error('Adapter returned no image data');
  }

  private async attachAssetsToContent(
    tenantId: string,
    userId: string,
    contentId: string,
    assetIds: string[],
    mediaType: 'image' | 'video' = 'image',
  ): Promise<void> {
    const content = await this.contentService.findOne(tenantId, contentId);
    const currentAssets = content.currentVersion?.assets ?? [];
    const existingIds = currentAssets.map((asset) =>
      typeof asset === 'string' ? asset : (asset as { id: string }).id,
    );

    const changeSummary =
      mediaType === 'video'
        ? 'Video generado por Image Generator'
        : assetIds.length > 1
          ? `Secuencia de ${assetIds.length} imágenes generada por Image Generator`
          : 'Imagen generada por Image Generator';

    await this.contentService.update(tenantId, userId, contentId, {
      assets: [...new Set([...existingIds, ...assetIds])],
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

  private generationHasVisual(record: AgentImageGenerationEntity): boolean {
    if (record.assetId) {
      return true;
    }
    return isImageGenerationMetadata(record.metadata) && record.metadata.frames.length > 0;
  }

  async findByContentId(
    tenantId: string,
    contentId: string,
  ): Promise<AgentImageGenerationEntity | null> {
    return this.generations.findOne({
      where: { tenantId, contentId },
      order: { createdAt: 'DESC' },
    });
  }

  async generateForContent(
    tenantId: string,
    userId: string,
    contentId: string,
  ): Promise<GenerateImageResult> {
    const content = await this.contentService.findOne(tenantId, contentId);
    const version = content.currentVersion;
    if (!version) {
      throw new NotFoundException({ error: 'Content has no version', code: 'NOT_FOUND' });
    }

    const existing = await this.findByContentId(tenantId, contentId);
    if (existing?.status === 'processing') {
      return this.toResult(existing);
    }
    if (existing?.status === 'completed' && this.generationHasVisual(existing)) {
      return this.toResult(existing);
    }
    if (existing?.status === 'failed' || (existing?.status === 'completed' && !this.generationHasVisual(existing))) {
      return this.retry(tenantId, userId, existing.id, { background: true });
    }

    const prompt = await this.buildContentBrandedPrompt(
      tenantId,
      version.title,
      version.body,
      content.productId ?? undefined,
    );
    const size = resolveImageSizeForPlatform(content.platform);
    const style = resolveImageStyleForPlatform(content.platform);
    return this.generate(tenantId, userId, prompt, {
      contentId,
      productId: content.productId ?? undefined,
      size,
      style,
      background: true,
    });
  }

  async regenerateForContent(
    tenantId: string,
    userId: string,
    contentId: string,
  ): Promise<GenerateImageResult> {
    const existing = await this.findByContentId(tenantId, contentId);
    if (existing) {
      await this.refreshBrandedPrompt(tenantId, existing);
      return this.retry(tenantId, userId, existing.id, { background: true });
    }

    return this.generateForContent(tenantId, userId, contentId);
  }

  async regenerate(
    tenantId: string,
    userId: string,
    id: string,
  ): Promise<GenerateImageResult> {
    const record = await this.findOne(tenantId, id);
    if (!record) {
      throw new NotFoundException({ error: 'Generation not found', code: 'NOT_FOUND' });
    }

    if (record.status === 'processing') {
      return this.toResult(record);
    }

    await this.refreshBrandedPrompt(tenantId, record);
    return this.retry(tenantId, userId, id, { background: true });
  }

  private async refreshBrandedPrompt(
    tenantId: string,
    record: AgentImageGenerationEntity,
  ): Promise<void> {
    if (!record.contentId) {
      return;
    }

    const content = await this.contentService.findOne(tenantId, record.contentId);
    const version = content.currentVersion;
    if (!version) {
      return;
    }

    record.prompt = await this.buildContentBrandedPrompt(
      tenantId,
      version.title,
      version.body,
      content.productId ?? record.productId ?? undefined,
    );

    if (content.productId && !record.productId) {
      record.productId = content.productId;
    }

    await this.generations.save(record);
  }

  async list(tenantId: string, limit = 50): Promise<AgentImageGenerationEntity[]> {
    return this.generations.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findOne(tenantId: string, id: string): Promise<AgentImageGenerationEntity | null> {
    return this.generations.findOne({ where: { id, tenantId } });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const record = await this.findOne(tenantId, id);
    if (!record) {
      throw new NotFoundException({ error: 'Generation not found', code: 'NOT_FOUND' });
    }
    await this.generations.delete(id);
  }

  async retry(
    tenantId: string,
    userId: string,
    id: string,
    options: { background?: boolean; size?: string; style?: string } = {},
  ): Promise<GenerateImageResult> {
    const record = await this.findOne(tenantId, id);
    if (!record) {
      throw new NotFoundException({ error: 'Generation not found', code: 'NOT_FOUND' });
    }

    record.status = 'processing';
    record.imageUrl = null;
    record.assetId = null;
    record.errorMessage = null;
    record.metadata = {};
    await this.generations.save(record);

    if (options.background) {
      this.imageWorker.enqueue({
        generationId: record.id,
        tenantId,
        userId,
        size: options.size,
        style: options.style,
      });
      return this.toResult(record);
    }

    return runWithLlmUsageContext({ tenantId, userId }, () =>
      this.runGeneration(tenantId, userId, record, record.prompt, {
        contentId: record.contentId ?? undefined,
        productId: record.productId ?? undefined,
        size: options.size,
        style: options.style,
      }),
    );
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
