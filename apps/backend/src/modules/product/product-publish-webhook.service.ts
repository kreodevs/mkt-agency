import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetService } from '../assets/asset.service';
import { AssetEntity } from '../assets/infrastructure/typeorm/asset.entity';
import { ContentVersionEntity } from '../content/infrastructure/typeorm/content-version.entity';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import {
  getProductPublishIntegrationConfig,
  resolveProductPublishWebhookUrl,
  type ProductPlatformCredential,
} from '../product/domain/product-publish-integration.metadata.util';
import { ProductPublishIntegrationService } from '../product/product-publish-integration.service';
import { sanitizePublishableCopy } from '../../shared/domain/sanitize-publishable-copy.util';
import { toDateKey, todayDateKey } from '../../shared/domain/date-key.util';

export type PublishWebhookTrigger = 'content.ready_to_publish' | 'content.manual_publish';

export interface PublishWebhookPayload {
  event: PublishWebhookTrigger;
  tenantId: string;
  productId: string;
  productName: string;
  contentId: string;
  platform: string | null;
  title: string;
  copy: string;
  scheduledDate: string;
  visualFormat: string;
  versionId: string;
  assets: Array<{
    assetId: string;
    url: string;
    mimeType: string | null;
    fileName: string;
    expiresIn: number;
  }>;
  callbackUrl: string;
  credentials: ProductPlatformCredential | null;
}

export interface DispatchPublishWebhookResult {
  contentId: string;
  dispatched: boolean;
  webhookUrl: string | null;
  reason?: string;
}

export interface MarkContentPublishedResult {
  contentId: string;
  publishedAt: string;
  externalPostId: string | null;
}

const DOWNLOAD_URL_TTL_SECONDS = 3600;

@Injectable()
export class ProductPublishWebhookService {
  private readonly logger = new Logger(ProductPublishWebhookService.name);

  constructor(
    @InjectRepository(ContentEntity)
    private readonly contents: Repository<ContentEntity>,
    @InjectRepository(ContentVersionEntity)
    private readonly versions: Repository<ContentVersionEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @InjectRepository(AssetEntity)
    private readonly assets: Repository<AssetEntity>,
    private readonly assetService: AssetService,
    private readonly integrationService: ProductPublishIntegrationService,
    private readonly config: ConfigService,
  ) {}

  async dispatchForContent(
    tenantId: string,
    contentId: string,
    trigger: PublishWebhookTrigger,
  ): Promise<DispatchPublishWebhookResult> {
    const content = await this.contents.findOne({ where: { id: contentId, tenantId } });
    if (!content) {
      throw new NotFoundException({ error: 'Contenido no encontrado', code: 'NOT_FOUND' });
    }
    if (!content.productId) {
      return {
        contentId,
        dispatched: false,
        webhookUrl: null,
        reason: 'El contenido no tiene producto asociado',
      };
    }
    if (content.publishedAt) {
      return {
        contentId,
        dispatched: false,
        webhookUrl: null,
        reason: 'El contenido ya está marcado como publicado',
      };
    }

    const product = await this.products.findOne({
      where: { id: content.productId, tenantId },
    });
    if (!product) {
      return {
        contentId,
        dispatched: false,
        webhookUrl: null,
        reason: 'Producto no encontrado',
      };
    }

    const webhookUrl = resolveProductPublishWebhookUrl(product.metadata, content.platform);
    const config = getProductPublishIntegrationConfig(product.metadata);
    if (!webhookUrl || !config.webhookSecret) {
      return {
        contentId,
        dispatched: false,
        webhookUrl: null,
        reason: 'Webhook de publicación no configurado para este producto',
      };
    }

    const version = content.currentVersionId
      ? await this.versions.findOne({ where: { id: content.currentVersionId } })
      : null;
    if (!version) {
      throw new BadRequestException({
        error: 'El contenido no tiene versión actual',
        code: 'INVALID_STATE',
      });
    }
    if (!version.signatureHash) {
      throw new BadRequestException({
        error: 'El contenido debe estar aprobado antes de publicar',
        code: 'INVALID_STATE',
      });
    }

    const payload = await this.buildPayload(tenantId, content, product, version, trigger);

    await this.postWebhook(webhookUrl, config.webhookSecret, payload);

    return { contentId, dispatched: true, webhookUrl };
  }

  async maybeAutoDispatchAfterApprove(
    tenantId: string,
    contentId: string,
  ): Promise<void> {
    try {
      const content = await this.contents.findOne({ where: { id: contentId, tenantId } });
      if (!content?.productId || content.publishedAt) return;

      const product = await this.products.findOne({
        where: { id: content.productId, tenantId },
      });
      if (!product) return;

      const config = getProductPublishIntegrationConfig(product.metadata);
      if (!config.autoDispatchOnReady || !config.enabled) return;

      const today = todayDateKey();
      const scheduled = toDateKey(content.scheduledDate) ?? today;
      if (scheduled > today) return;

      await this.dispatchForContent(tenantId, contentId, 'content.ready_to_publish');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Auto-dispatch failed';
      this.logger.warn(`Auto publish webhook failed for ${contentId}: ${message}`);
    }
  }

  async markPublished(params: {
    tenantId: string;
    productId: string;
    contentId: string;
    externalPostId?: string | null;
  }): Promise<MarkContentPublishedResult> {
    const content = await this.contents.findOne({
      where: { id: params.contentId, tenantId: params.tenantId },
    });
    if (!content) {
      throw new NotFoundException({ error: 'Contenido no encontrado', code: 'NOT_FOUND' });
    }
    if (content.productId !== params.productId) {
      throw new BadRequestException({
        error: 'El contenido no pertenece al producto indicado',
        code: 'VALIDATION_ERROR',
      });
    }
    if (content.publishedAt) {
      return {
        contentId: content.id,
        publishedAt: content.publishedAt.toISOString(),
        externalPostId: content.externalPostId,
      };
    }

    content.publishedAt = new Date();
    content.externalPostId = params.externalPostId?.trim() || null;
    await this.contents.save(content);

    return {
      contentId: content.id,
      publishedAt: content.publishedAt.toISOString(),
      externalPostId: content.externalPostId,
    };
  }

  async markPublishedForTenantUser(
    tenantId: string,
    contentId: string,
    externalPostId?: string | null,
  ): Promise<MarkContentPublishedResult> {
    const content = await this.contents.findOne({ where: { id: contentId, tenantId } });
    if (!content?.productId) {
      throw new BadRequestException({
        error: 'El contenido no tiene producto asociado',
        code: 'VALIDATION_ERROR',
      });
    }

    return this.markPublished({
      tenantId,
      productId: content.productId,
      contentId,
      externalPostId,
    });
  }

  private async buildPayload(
    tenantId: string,
    content: ContentEntity,
    product: ProductEntity,
    version: ContentVersionEntity,
    trigger: PublishWebhookTrigger,
  ): Promise<PublishWebhookPayload> {
    const assetIds = this.extractAssetIds(version.assets);
    const assets = await Promise.all(
      assetIds.map(async (assetId) => {
        const asset = await this.assets.findOne({ where: { id: assetId, tenantId } });
        const signed = await this.assetService.getDownloadUrl(tenantId, assetId);
        return {
          assetId,
          url: signed.url,
          mimeType: asset?.mimeType ?? null,
          fileName: asset?.name ?? assetId,
          expiresIn: signed.expiresIn,
        };
      }),
    );

    const config = getProductPublishIntegrationConfig(product.metadata);
    const platformKey = content.platform?.trim().toLowerCase() ?? '';
    const credentials =
      platformKey && config.credentialsByPlatform[platformKey]
        ? config.credentialsByPlatform[platformKey]
        : null;

    const apiBase = this.config.get<string>('API_PUBLIC_URL', 'http://localhost:3000/api/v1');
    const callbackUrl = `${apiBase.replace(/\/$/, '')}/publication-inbox/webhook/${tenantId}/mark-published`;

    const scheduledDate =
      toDateKey(content.scheduledDate) ??
      (content.createdAt instanceof Date
        ? content.createdAt.toISOString().slice(0, 10)
        : new Date(content.createdAt).toISOString().slice(0, 10));

    return {
      event: trigger,
      tenantId,
      productId: product.id,
      productName: product.name,
      contentId: content.id,
      platform: content.platform,
      title: content.title,
      copy: sanitizePublishableCopy(version.body ?? ''),
      scheduledDate,
      visualFormat: content.visualFormat ?? 'image',
      versionId: version.id,
      assets,
      callbackUrl,
      credentials,
    };
  }

  private async postWebhook(
    url: string,
    secret: string,
    payload: PublishWebhookPayload,
  ): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': secret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new BadRequestException({
        error: `El webhook respondió ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`,
        code: 'WEBHOOK_FAILED',
      });
    }
  }

  private extractAssetIds(assets: unknown): string[] {
    const list = Array.isArray(assets) ? assets : [];
    const ids: string[] = [];

    for (const asset of list) {
      if (typeof asset === 'string') {
        ids.push(asset);
      } else if (asset && typeof asset === 'object' && 'id' in asset) {
        ids.push(String((asset as { id: unknown }).id));
      }
    }

    return ids;
  }
}
