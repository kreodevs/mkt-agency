import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetService } from '../assets/asset.service';
import {
  IMAGE_GENERATION_ADAPTER,
  ImageGenerationAdapterPort,
  ImageGenerationResult,
} from './adapters/image-generation.adapter.port';
import { AgentImageGenerationEntity } from './domain/agent-image-generation.entity';
import {
  buildFramePrompt,
  detectReelFrameCount,
  isImageGenerationMetadata,
  type ImageGenerationFrameMeta,
  type ImageGenerationMetadata,
} from './domain/image-generation.utils';
import { ContentService } from '../content/content.service';

export interface GenerateImageOptions {
  style?: string;
  size?: string;
  productId?: string;
  contentId?: string;
}

export interface GenerateImageResult {
  id: string;
  assetId: string | null;
  imageUrl: string | null;
  status: string;
  contentId: string | null;
  metadata?: ImageGenerationMetadata;
}

@Injectable()
export class ImageGenerationService {
  private readonly logger = new Logger(ImageGenerationService.name);

  constructor(
    @InjectRepository(AgentImageGenerationEntity)
    private readonly generations: Repository<AgentImageGenerationEntity>,
    @Inject(IMAGE_GENERATION_ADAPTER)
    private readonly adapter: ImageGenerationAdapterPort,
    private readonly assetService: AssetService,
    private readonly contentService: ContentService,
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

    return this.runGeneration(tenantId, userId, record, trimmed, options);
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

    return this.generate(tenantId, userId, visualDescription, {
      contentId,
      productId,
      size: '1024x1024',
      style: 'social media post, professional',
    });
  }

  private async runGeneration(
    tenantId: string,
    userId: string,
    record: AgentImageGenerationEntity,
    prompt: string,
    options: GenerateImageOptions,
  ): Promise<GenerateImageResult> {
    try {
      const frameCount = detectReelFrameCount(prompt);
      const frames: ImageGenerationFrameMeta[] = [];

      for (let index = 0; index < frameCount; index += 1) {
        const framePrompt = buildFramePrompt(prompt, index, frameCount);
        const result = await this.adapter.generateImage(framePrompt, {
          size: options.size,
          style: options.style,
        });

        const asset = await this.uploadGeneratedImage(tenantId, prompt, index, frameCount, result);
        frames.push({ assetId: asset.id, index });
      }

      const primary = frames[0];
      const metadata: ImageGenerationMetadata = { frameCount, frames };

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
        );
      }

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
  ) {
    const { buffer: imageBuffer, contentType } = await this.resolveImagePayload(result);
    const extension = contentType.split('/').pop() || 'png';
    const slug = prompt.slice(0, 32).replace(/[^a-zA-Z0-9]/g, '_');
    const suffix = frameCount > 1 ? `_frame${index + 1}` : '';
    const fileName = `${slug}${suffix}.${extension}`;

    const fakeFile: Express.Multer.File = {
      buffer: imageBuffer,
      originalname: fileName,
      mimetype: contentType,
      size: imageBuffer.length,
      fieldname: 'file',
      encoding: '7bit',
      stream: null as unknown as import('stream').Readable,
      destination: '',
      filename: fileName,
      path: '',
    };

    return this.assetService.upload(tenantId, fakeFile);
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
  ): Promise<void> {
    const content = await this.contentService.findOne(tenantId, contentId);
    const currentAssets = content.currentVersion?.assets ?? [];
    const existingIds = currentAssets.map((asset) =>
      typeof asset === 'string' ? asset : (asset as { id: string }).id,
    );

    await this.contentService.update(tenantId, userId, contentId, {
      assets: [...new Set([...existingIds, ...assetIds])],
      changeSummary:
        assetIds.length > 1
          ? `Secuencia de ${assetIds.length} imágenes generada por Image Generator`
          : 'Imagen generada por Image Generator',
    });
  }

  private toResult(record: AgentImageGenerationEntity): GenerateImageResult {
    return {
      id: record.id,
      assetId: record.assetId,
      imageUrl: record.imageUrl,
      status: record.status,
      contentId: record.contentId,
      metadata: isImageGenerationMetadata(record.metadata) ? record.metadata : undefined,
    };
  }

  async findByContentId(
    tenantId: string,
    contentId: string,
  ): Promise<AgentImageGenerationEntity | null> {
    return this.generations.findOne({ where: { tenantId, contentId } });
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

    return this.runGeneration(tenantId, userId, record, record.prompt, {
      contentId: record.contentId ?? undefined,
      productId: record.productId ?? undefined,
    });
  }
}
