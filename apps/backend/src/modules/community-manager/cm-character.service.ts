import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMAGE_GENERATION_ADAPTER, ImageGenerationAdapterPort } from '../agents/adapters/image-generation.adapter.port';
import { TalkingHeadComposerService } from '../agents/talking-head-composer.service';
import { AssetService } from '../assets/asset.service';
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import { ProductService } from '../product/product.service';
import {
  CM_CHARACTER_METADATA_KEY,
  CM_PORTRAIT_SIZE,
  CM_PREVIEW_SCRIPT,
  DEFAULT_CM_VOICE_ID,
  DEFAULT_CM_VOICE_NAME,
  type CmCharacterConfig,
} from './domain/cm-character.constants';
import {
  buildCmPortraitPrompt,
  isCmCharacterReady,
  mergeCmCharacterConfig,
  parseCmCharacterConfig,
} from './domain/cm-character.util';
import type {
  CmCharacterGenerateResponseDto,
  CmCharacterStatusResponseDto,
  UpdateCmCharacterAppearanceDto,
} from './dto/cm-character.dto';

@Injectable()
export class CmCharacterService {
  private readonly logger = new Logger(CmCharacterService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @InjectRepository(CompanyProfileEntity)
    private readonly profiles: Repository<CompanyProfileEntity>,
    private readonly productService: ProductService,
    private readonly assetService: AssetService,
    private readonly talkingHeadComposer: TalkingHeadComposerService,
    @Inject(IMAGE_GENERATION_ADAPTER)
    private readonly imageAdapter: ImageGenerationAdapterPort,
  ) {}

  async getStatus(tenantId: string, productId: string): Promise<CmCharacterStatusResponseDto> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const config = parseCmCharacterConfig(product.metadata);

    return {
      productId: product.id,
      ready: isCmCharacterReady(config),
      status: config?.status ?? 'pending',
      portraitAssetId: config?.portraitAssetId ?? null,
      previewVideoAssetId: config?.previewVideoAssetId ?? null,
      appearance: config?.appearance ?? null,
      voiceId: config?.voiceId ?? DEFAULT_CM_VOICE_ID,
      voiceName: config?.voiceName ?? DEFAULT_CM_VOICE_NAME,
      errorMessage: config?.errorMessage ?? null,
    };
  }

  async updateAppearance(
    tenantId: string,
    productId: string,
    dto: UpdateCmCharacterAppearanceDto,
  ): Promise<CmCharacterStatusResponseDto> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const current = parseCmCharacterConfig(product.metadata);

    const next = mergeCmCharacterConfig(current, {
      appearance: {
        ...current?.appearance,
        gender: dto.gender ?? current?.appearance?.gender,
        ageRange: dto.ageRange ?? current?.appearance?.ageRange,
        style: dto.style ?? current?.appearance?.style,
        background: dto.background ?? current?.appearance?.background,
        notes: dto.notes ?? current?.appearance?.notes,
      },
      voiceId: dto.voiceId?.trim() || current?.voiceId || DEFAULT_CM_VOICE_ID,
      voiceName: dto.voiceName?.trim() || current?.voiceName || DEFAULT_CM_VOICE_NAME,
      status: current?.status === 'ready' ? 'ready' : 'pending',
      errorMessage: null,
    });

    await this.saveConfig(product, next);
    return this.getStatus(tenantId, productId);
  }

  async generatePortrait(
    tenantId: string,
    userId: string,
    productId: string,
  ): Promise<CmCharacterGenerateResponseDto> {
    void userId;
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const current = parseCmCharacterConfig(product.metadata) ?? { status: 'pending' as const };

    await this.saveConfig(
      product,
      mergeCmCharacterConfig(current, {
        status: 'generating_portrait',
        errorMessage: null,
      }),
    );

    try {
      const profile = await this.profiles.findOne({ where: { tenantId } });
      const prompt = buildCmPortraitPrompt(current.appearance, {
        industry: profile?.industry ?? null,
        brandVoice: profile?.brandVoice ?? null,
      });

      const generated = await this.imageAdapter.generateImage(prompt, {
        size: CM_PORTRAIT_SIZE,
        style: 'corporate professional portrait photography',
        taskType: 'cm_portrait_generation',
      });

      let buffer: Buffer;
      let mimeType = generated.mimeType ?? 'image/png';

      if (generated.imageBuffer) {
        buffer = generated.imageBuffer;
      } else if (generated.imageUrl) {
        const response = await fetch(generated.imageUrl);
        if (!response.ok) {
          throw new Error(`No se pudo descargar el retrato (${response.status})`);
        }
        buffer = Buffer.from(await response.arrayBuffer());
        mimeType = response.headers.get('content-type') ?? mimeType;
      } else {
        throw new Error('La generación de retrato no devolvió imagen');
      }

      const extension = mimeType.split('/').pop() || 'png';
      const fakeFile: Express.Multer.File = {
        buffer,
        originalname: `cm-retrato-${product.id.slice(0, 8)}.${extension}`,
        mimetype: mimeType,
        size: buffer.length,
        fieldname: 'file',
        encoding: '7bit',
        stream: null as unknown as import('stream').Readable,
        destination: '',
        filename: `cm-retrato.${extension}`,
        path: '',
      };

      const asset = await this.assetService.upload(tenantId, fakeFile, undefined, undefined, {
        source: 'cm-character',
        kind: 'portrait',
        productId: product.id,
      });

      await this.saveConfig(
        product,
        mergeCmCharacterConfig(current, {
          portraitAssetId: asset.id,
          status: 'pending',
          errorMessage: null,
        }),
      );

      return {
        portraitAssetId: asset.id,
        status: 'pending',
        message: 'Retrato generado. Genera la vista previa para activar la CM virtual.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al generar retrato';
      this.logger.error(`CM portrait failed for product ${productId}`, error);
      await this.saveConfig(
        product,
        mergeCmCharacterConfig(current, {
          status: 'failed',
          errorMessage: message,
        }),
      );
      throw new BadRequestException({ error: message, code: 'CM_PORTRAIT_FAILED' });
    }
  }

  async generatePreview(
    tenantId: string,
    userId: string,
    productId: string,
  ): Promise<CmCharacterGenerateResponseDto> {
    void userId;
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const current = parseCmCharacterConfig(product.metadata);

    if (!current?.portraitAssetId) {
      throw new BadRequestException({
        error: 'Genera primero el retrato de la CM virtual',
        code: 'CM_PORTRAIT_MISSING',
      });
    }

    await this.saveConfig(
      product,
      mergeCmCharacterConfig(current, {
        status: 'generating_preview',
        errorMessage: null,
      }),
    );

    try {
      const composed = await this.talkingHeadComposer.compose({
        tenantId,
        productId: product.id,
        portraitAssetId: current.portraitAssetId,
        script: CM_PREVIEW_SCRIPT,
        voiceId: current.voiceId ?? DEFAULT_CM_VOICE_ID,
        metadata: { phase: 'preview' },
      });

      await this.saveConfig(
        product,
        mergeCmCharacterConfig(current, {
          previewVideoAssetId: composed.videoAssetId,
          status: 'ready',
          readyAt: new Date().toISOString(),
          errorMessage: null,
        }),
      );

      return {
        previewVideoAssetId: composed.videoAssetId,
        portraitAssetId: current.portraitAssetId,
        status: 'ready',
        message: 'CM virtual lista. Los reels de TikTok usarán este retrato.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al generar vista previa';
      this.logger.error(`CM preview failed for product ${productId}`, error);
      await this.saveConfig(
        product,
        mergeCmCharacterConfig(current, {
          status: 'failed',
          errorMessage: message,
        }),
      );
      throw new BadRequestException({ error: message, code: 'CM_PREVIEW_FAILED' });
    }
  }

  async assertReadyForTalkingHead(tenantId: string, productId: string): Promise<CmCharacterConfig> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const config = parseCmCharacterConfig(product.metadata);
    if (!isCmCharacterReady(config) || !config?.portraitAssetId) {
      throw new NotFoundException({
        error: 'La CM virtual no está configurada. Completa la actividad inicial.',
        code: 'CM_CHARACTER_NOT_READY',
      });
    }
    return config;
  }

  private async saveConfig(product: ProductEntity, config: CmCharacterConfig): Promise<void> {
    product.metadata = {
      ...(product.metadata ?? {}),
      [CM_CHARACTER_METADATA_KEY]: config,
    };
    await this.products.save(product);
  }
}
