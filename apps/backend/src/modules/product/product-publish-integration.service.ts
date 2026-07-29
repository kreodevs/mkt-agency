import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import {
  getProductPublishIntegrationConfig,
  isProductPublishWebhookConfigured,
  withProductPublishIntegrationMetadata,
} from './domain/product-publish-integration.metadata.util';
import {
  ProductPublishIntegrationResponseDto,
  UpdateProductPublishIntegrationDto,
} from './dto/product-publish-integration.dto';
import { ProductEntity } from './infrastructure/typeorm/product.entity';

@Injectable()
export class ProductPublishIntegrationService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
  ) {}

  async getIntegration(
    tenantId: string,
    productId: string,
  ): Promise<ProductPublishIntegrationResponseDto> {
    const product = await this.findOwnedProduct(tenantId, productId);
    return this.toResponse(product, tenantId);
  }

  async updateIntegration(
    tenantId: string,
    productId: string,
    dto: UpdateProductPublishIntegrationDto,
  ): Promise<ProductPublishIntegrationResponseDto> {
    const product = await this.findOwnedProduct(tenantId, productId);
    const current = getProductPublishIntegrationConfig(product.metadata);
    const metadata = { ...(product.metadata ?? {}) };

    let webhookSecret = current.webhookSecret;
    if (dto.regenerateSecret) {
      webhookSecret = randomBytes(24).toString('hex');
    } else if (dto.webhookSecret !== undefined && dto.webhookSecret.length >= 16) {
      webhookSecret = dto.webhookSecret;
    } else if ((dto.enabled === true || (dto.enabled === undefined && current.enabled)) && !webhookSecret) {
      webhookSecret = randomBytes(24).toString('hex');
    }

    const nextMetadata = withProductPublishIntegrationMetadata(metadata, {
      ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      ...(dto.webhookUrl !== undefined ? { webhookUrl: dto.webhookUrl ?? null } : {}),
      ...(webhookSecret !== current.webhookSecret ? { webhookSecret } : {}),
      ...(dto.autoDispatchOnReady !== undefined
        ? { autoDispatchOnReady: dto.autoDispatchOnReady }
        : {}),
      ...(dto.webhooksByPlatform !== undefined
        ? { webhooksByPlatform: dto.webhooksByPlatform }
        : {}),
      ...(dto.credentialsByPlatform !== undefined
        ? { credentialsByPlatform: dto.credentialsByPlatform }
        : {}),
    });

    product.metadata = nextMetadata;
    await this.products.save(product);
    return this.toResponse(product, tenantId);
  }

  async validateWebhookSecret(
    tenantId: string,
    productId: string,
    provided: string | undefined,
  ): Promise<void> {
    const product = await this.findOwnedProduct(tenantId, productId);
    const config = getProductPublishIntegrationConfig(product.metadata);
    if (!config.webhookSecret) {
      throw new NotFoundException({
        error: 'Webhook no configurado para este producto',
        code: 'NOT_FOUND',
      });
    }

    const a = createHash('sha256').update(config.webhookSecret).digest();
    const b = createHash('sha256').update(provided ?? '').digest();
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException({
        error: 'Invalid webhook secret',
        code: 'UNAUTHORIZED',
      });
    }
  }

  private async findOwnedProduct(tenantId: string, productId: string): Promise<ProductEntity> {
    const product = await this.products.findOne({ where: { id: productId, tenantId } });
    if (!product) {
      throw new NotFoundException({ error: 'Producto no encontrado', code: 'NOT_FOUND' });
    }
    return product;
  }

  private toResponse(
    product: ProductEntity,
    tenantId: string,
  ): ProductPublishIntegrationResponseDto {
    const config = getProductPublishIntegrationConfig(product.metadata);
    const configured = isProductPublishWebhookConfigured(product.metadata);

    return {
      enabled: config.enabled,
      webhookUrl: config.webhookUrl,
      hasWebhookSecret: Boolean(config.webhookSecret),
      webhookSecret: config.webhookSecret,
      autoDispatchOnReady: config.autoDispatchOnReady,
      webhooksByPlatform: config.webhooksByPlatform,
      credentialsByPlatform: config.credentialsByPlatform,
      callbackPath: `/api/v1/publication-inbox/webhook/${tenantId}/mark-published`,
      configured,
    };
  }
}

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}
