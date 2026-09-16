import { Injectable, Logger } from '@nestjs/common';
import { getProductLogoAssetId } from '../product/domain/product-logo.metadata.util';
import { ProductService } from '../product/product.service';
import { applyLogoOverlayToVideo } from './domain/video-logo-overlay.util';
import { ImageBrandingService } from './image-branding.service';

@Injectable()
export class VideoBrandingService {
  private readonly logger = new Logger(VideoBrandingService.name);

  constructor(
    private readonly imageBranding: ImageBrandingService,
    private readonly productService: ProductService,
  ) {}

  async applyProductLogoToVideo(
    tenantId: string,
    productId: string,
    videoBuffer: Buffer,
  ): Promise<Buffer> {
    try {
      const product = await this.productService.findOwnedEntity(tenantId, productId);
      const logoAssetId = getProductLogoAssetId(product.metadata);
      if (!logoAssetId) {
        this.logger.warn(
          `Product ${productId} (${product.name}) has no logo — skipping video logo overlay`,
        );
        return videoBuffer;
      }

      const logoPng = await this.imageBranding.prepareLogoOverlayPng(
        tenantId,
        logoAssetId,
        512,
      );
      const branded = await applyLogoOverlayToVideo({ videoBuffer, logoPng });
      if (!branded) {
        this.logger.warn(`FFmpeg logo overlay failed for product ${productId}`);
        return videoBuffer;
      }

      return branded;
    } catch (error) {
      this.logger.warn(
        `Video logo overlay skipped for product ${productId}: ${
          error instanceof Error ? error.message : error
        }`,
      );
      return videoBuffer;
    }
  }
}
