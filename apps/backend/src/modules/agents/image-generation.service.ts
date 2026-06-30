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
} from './adapters/image-generation.adapter.port';
import { AgentImageGenerationEntity } from './domain/agent-image-generation.entity';
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
      }),
    );

    try {
      const result = await this.adapter.generateImage(trimmed, {
        size: options.size,
        style: options.style,
      });

      if (!result.imageUrl) {
        throw new Error('Adapter returned no image URL');
      }

      const imageResponse = await fetch(result.imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download generated image: ${imageResponse.status}`);
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const contentType = imageResponse.headers.get('content-type') || 'image/png';
      const extension = contentType.split('/').pop() || 'png';
      const fileName = `${trimmed.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;

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

      const asset = await this.assetService.upload(tenantId, fakeFile);

      record.imageUrl = asset.url ?? result.imageUrl;
      record.assetId = asset.id;
      record.status = 'completed';
      await this.generations.save(record);

      if (options.contentId && asset.id) {
        await this.attachAssetToContent(tenantId, userId, options.contentId, asset.id);
      }

      return {
        id: record.id,
        assetId: record.assetId,
        imageUrl: record.imageUrl,
        status: record.status,
        contentId: record.contentId,
      };
    } catch (error) {
      this.logger.warn(`Image generation failed: ${error instanceof Error ? error.message : error}`);
      record.status = 'failed';
      record.errorMessage = error instanceof Error ? error.message : 'Generation failed';
      await this.generations.save(record);
      return {
        id: record.id,
        assetId: null,
        imageUrl: null,
        status: 'failed',
        contentId: record.contentId,
      };
    }
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

  private async attachAssetToContent(
    tenantId: string,
    userId: string,
    contentId: string,
    assetId: string,
  ): Promise<void> {
    const content = await this.contentService.findOne(tenantId, contentId);
    const currentAssets = content.currentVersion?.assets ?? [];
    const assetIds = [
      ...currentAssets.map((asset) =>
        typeof asset === 'string' ? asset : (asset as { id: string }).id,
      ),
      assetId,
    ];

    await this.contentService.update(tenantId, userId, contentId, {
      assets: [...new Set(assetIds)],
      changeSummary: 'Imagen generada por Image Generator',
    });
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
}
