import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetService } from '../assets/asset.service';
import { ContentService } from '../content/content.service';
import { AgentImageGenerationEntity } from '../agents/domain/agent-image-generation.entity';
import { ImageBrandingService } from '../agents/image-branding.service';
import { resolveImageSizeForPlatform } from '../../shared/social/image-destination-formats.util';
import type { ContentImageDestination } from '../content/domain/content.constants';
import { normalizeContentVisualFormat, visualFormatToFrameCount } from '../content/domain/content-visual-format.util';
import type { ResolvedProfileValues } from '../company-profile/services/profile-section-sync.service';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import { ProductService } from '../product/product.service';
import { ProductMediaKitService } from '../product/product-media-kit.service';
import type { ProductMediaKitItemEntity } from '../product/infrastructure/typeorm/product-media-kit-item.entity';
import type { SocialCopyPost } from './adapters/social-copy.adapter.port';
import {
  buildVisualTemplateSlots,
  renderVisualTemplateFrame,
  splitCarouselTips,
} from './domain/visual-template-render.util';
import {
  persistDerivedBrandVisualKit,
  resolveVisualBrandKit,
  resolveVisualTemplateId,
} from './domain/visual-brand-kit.util';
import type { VisualTemplateId } from './domain/visual-template.constants';

export interface VisualTemplateComposeContext {
  resolvedProfile: ResolvedProfileValues | null;
}

export interface VisualTemplateComposeResult {
  attached: boolean;
  assetIds: string[];
  templateId?: VisualTemplateId;
}

@Injectable()
export class VisualTemplateComposerService {
  private readonly logger = new Logger(VisualTemplateComposerService.name);

  constructor(
    private readonly contentService: ContentService,
    private readonly assetService: AssetService,
    private readonly productService: ProductService,
    private readonly mediaKit: ProductMediaKitService,
    private readonly imageBranding: ImageBrandingService,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @InjectRepository(AgentImageGenerationEntity)
    private readonly generations: Repository<AgentImageGenerationEntity>,
  ) {}

  async tryComposeFromTemplate(
    tenantId: string,
    userId: string,
    contentId: string,
    post: SocialCopyPost,
    productId: string,
    kit: ProductMediaKitItemEntity[],
    postIndex: number,
    ctx: VisualTemplateComposeContext,
    options?: {
      forceTemplateId?: VisualTemplateId;
      variationSeed?: number;
      imageDestination?: ContentImageDestination;
    },
  ): Promise<VisualTemplateComposeResult> {
    const visualFormat = normalizeContentVisualFormat(post.visualFormat);
    if (visualFormat === 'talking-head') {
      return { attached: false, assetIds: [] };
    }

    try {
      const product = await this.productService.findOwnedEntity(tenantId, productId);
      const brandKit = resolveVisualBrandKit(product, ctx.resolvedProfile);
      const persisted = persistDerivedBrandVisualKit(product, brandKit);
      if (persisted !== product) {
        await this.products.save(persisted);
      }

      const templateId = options?.forceTemplateId ?? resolveVisualTemplateId(post);
      const size = resolveImageSizeForPlatform(
        post.platform,
        options?.imageDestination ?? post.imageDestination,
      );
      const frameCount =
        visualFormat === 'carousel' ? visualFormatToFrameCount('carousel') : 1;

      const imagePicks = await this.mediaKit.pickComposeImagePicks(
        tenantId,
        kit,
        visualFormat,
        postIndex + (options?.variationSeed ?? 0),
        post.platform,
      );

      const logoFile = brandKit.logoAssetId
        ? await this.assetService.readFile(tenantId, brandKit.logoAssetId).catch(() => null)
        : null;

      const assetIds: string[] = [];
      const frames: Array<{ assetId: string; index: number }> = [];

      for (let slideIndex = 0; slideIndex < frameCount; slideIndex += 1) {
        const pick =
          imagePicks[slideIndex % Math.max(imagePicks.length, 1)] ?? imagePicks[0];
        const photoAssetId = pick?.assetId;
        const photoFile = photoAssetId
          ? await this.assetService.readFile(tenantId, photoAssetId).catch(() => null)
          : null;

        const slots = buildVisualTemplateSlots(
          {
            title: post.title,
            body:
              visualFormat === 'carousel'
                ? splitCarouselTips(post.body, frameCount)[slideIndex] ?? post.body
                : post.body,
            callToAction: post.callToAction,
            visualHeadline: post.visualHeadline,
            visualSubline: post.visualSubline,
            visualCta: post.visualCta,
          },
          templateId,
          slideIndex,
          frameCount,
        );

        let buffer = await renderVisualTemplateFrame({
          templateId,
          brandKit,
          slots,
          size,
          platform: post.platform,
          slideIndex,
          slideCount: frameCount,
          photoBuffer: photoFile?.buffer ?? null,
          logoBuffer: logoFile?.buffer ?? null,
          logoMimeType: logoFile?.mimeType ?? null,
          screenshotDevice: pick?.device ?? null,
        });

        if (brandKit.logoAssetId && !logoFile) {
          buffer = await this.imageBranding
            .applyProductLogo(tenantId, buffer, brandKit.logoAssetId)
            .catch(() => buffer);
        }

        const uploaded = await this.uploadFrame(
          tenantId,
          buffer,
          contentId,
          productId,
          post.platform,
          slideIndex,
          frameCount,
          templateId,
          slots,
          brandKit,
        );
        assetIds.push(uploaded.id);
        frames.push({ assetId: uploaded.id, index: slideIndex });
      }

      const generation = await this.generations.save(
        this.generations.create({
          tenantId,
          prompt: `${templateId}: ${post.visualHeadline ?? post.title}`.slice(0, 500),
          status: 'completed',
          productId,
          contentId,
          imageUrl: `/api/v1/assets/${assetIds[0]}/file`,
          assetId: assetIds[0] ?? null,
          metadata: {
            mediaType: 'image',
            intendedMediaType: 'image',
            frameCount,
            frames,
            pipeline: 'visual-template',
            templateId,
            headline: post.visualHeadline ?? null,
            subline: post.visualSubline ?? null,
            cta: post.visualCta ?? null,
            imageDestination: options?.imageDestination ?? post.imageDestination ?? 'feed',
            brandKit: {
              style: brandKit.style,
              primaryColor: brandKit.primaryColor,
              secondaryColor: brandKit.secondaryColor,
              accentColor: brandKit.accentColor,
            },
          },
        }),
      );

      await this.contentService.update(tenantId, userId, contentId, {
        assets: assetIds,
        changeSummary:
          frameCount > 1
            ? `Carrusel diseñado (${templateId}, ${frameCount} slides)`
            : `Diseño de marca (${templateId})`,
      });

      this.logger.log(
        `Template compose ${templateId} for content ${contentId} (generation ${generation.id})`,
      );

      return { attached: true, assetIds, templateId };
    } catch (error) {
      this.logger.warn(
        `Template compose failed for content ${contentId}: ${error instanceof Error ? error.message : error}`,
      );
      return { attached: false, assetIds: [] };
    }
  }

  async recomposeFromStoredTemplate(
    tenantId: string,
    userId: string,
    contentId: string,
    post: SocialCopyPost,
    productId: string,
    kit: ProductMediaKitItemEntity[],
    postIndex: number,
    ctx: VisualTemplateComposeContext,
  ): Promise<boolean> {
    const previous = await this.generations.find({
      where: { tenantId, contentId },
      order: { createdAt: 'DESC' },
      take: 1,
    });
    const last = previous[0];
    const metadata = last?.metadata as Record<string, unknown> | null;
    const templateId = metadata?.templateId;
    if (metadata?.pipeline !== 'visual-template' || typeof templateId !== 'string') {
      return false;
    }

    const result = await this.tryComposeFromTemplate(
      tenantId,
      userId,
      contentId,
      {
        ...post,
        visualTemplateId: templateId as VisualTemplateId,
        visualHeadline:
          post.visualHeadline ??
          (typeof metadata.headline === 'string' ? metadata.headline : undefined),
        visualSubline:
          post.visualSubline ??
          (typeof metadata.subline === 'string' ? metadata.subline : undefined),
        visualCta:
          post.visualCta ?? (typeof metadata.cta === 'string' ? metadata.cta : undefined),
      },
      productId,
      kit,
      postIndex,
      ctx,
      {
        forceTemplateId: templateId as VisualTemplateId,
        variationSeed: (last?.metadata as { variationSeed?: number })?.variationSeed
          ? Number((last.metadata as { variationSeed: number }).variationSeed) + 1
          : 1,
      },
    );
    return result.attached;
  }

  private async uploadFrame(
    tenantId: string,
    buffer: Buffer,
    contentId: string,
    productId: string,
    platform: string,
    slideIndex: number,
    frameCount: number,
    templateId: VisualTemplateId,
    slots: ReturnType<typeof buildVisualTemplateSlots>,
    brandKit: ReturnType<typeof resolveVisualBrandKit>,
  ) {
    const suffix = frameCount > 1 ? `-slide${slideIndex + 1}` : '';
    const fakeFile: Express.Multer.File = {
      buffer,
      originalname: `template-${templateId}${suffix}.png`,
      mimetype: 'image/png',
      size: buffer.length,
      fieldname: 'file',
      encoding: '7bit',
      stream: null as unknown as import('stream').Readable,
      destination: '',
      filename: `template-${templateId}${suffix}.png`,
      path: '',
    };

    return this.assetService.upload(tenantId, fakeFile, undefined, undefined, {
      source: 'visual-template',
      contentId,
      productId,
      platform,
      frameIndex: slideIndex,
      frameCount,
      templateId,
      headline: slots.headline,
      subline: slots.subline ?? null,
      cta: slots.cta ?? null,
      brandKit,
    });
  }
}
