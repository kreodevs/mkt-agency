import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetService } from '../assets/asset.service';
import { extractLogoCandidates } from '../../shared/web/logo-extraction.util';
import { fetchPageContent, normalizePageUrl } from '../../shared/web/page-content.util';
import {
  getProductLogoAssetId,
  withProductLogoMetadata,
  withoutProductLogoMetadata,
} from './domain/product-logo.metadata.util';
import { ProductEntity } from './infrastructure/typeorm/product.entity';
import { ProductService } from './product.service';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export interface ProductLogoSyncResult {
  logoAssetId: string | null;
  logoUrl: string | null;
  logoSourceUrl: string | null;
  synced: boolean;
}

@Injectable()
export class ProductLogoService {
  private readonly logger = new Logger(ProductLogoService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    private readonly productService: ProductService,
    private readonly assets: AssetService,
  ) {}

  async syncFromWebsite(
    tenantId: string,
    productId: string,
    url?: string,
  ): Promise<ProductLogoSyncResult> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const targetUrl = url?.trim() || product.websiteUrl?.trim();

    if (!targetUrl) {
      throw new BadRequestException({
        error: 'Indica la URL del producto para extraer el logo',
        code: 'VALIDATION_ERROR',
      });
    }

    let page: Awaited<ReturnType<typeof fetchPageContent>>;
    try {
      page = await fetchPageContent(targetUrl);
    } catch (error) {
      throw new BadRequestException({
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo acceder a la URL del producto',
        code: 'PAGE_FETCH_FAILED',
      });
    }

    const candidates = extractLogoCandidates(page.html, page.url);

    if (candidates.length === 0) {
      return {
        logoAssetId: getProductLogoAssetId(product.metadata),
        logoUrl: this.buildLogoUrl(getProductLogoAssetId(product.metadata)),
        logoSourceUrl: null,
        synced: false,
      };
    }

    for (const candidate of candidates) {
      const stored = await this.tryDownloadLogo(tenantId, product, candidate);
      if (stored) {
        return stored;
      }
    }

    throw new BadRequestException({
      error: 'No se pudo descargar un logo válido desde la página del producto',
      code: 'LOGO_FETCH_FAILED',
    });
  }

  async uploadLogo(
    tenantId: string,
    productId: string,
    file: Express.Multer.File,
  ): Promise<ProductLogoSyncResult> {
    if (!file?.buffer?.length) {
      throw new BadRequestException({
        error: 'Archivo de logo requerido',
        code: 'VALIDATION_ERROR',
      });
    }

    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const mimeType = file.mimetype ?? 'image/png';
    if (!mimeType.startsWith('image/')) {
      throw new BadRequestException({
        error: 'El logo debe ser una imagen (PNG, JPG, SVG, WebP)',
        code: 'VALIDATION_ERROR',
      });
    }

    const asset = await this.assets.upload(tenantId, file);
    return this.attachLogoAsset(product, asset.id, null);
  }

  async removeLogo(tenantId: string, productId: string): Promise<ProductLogoSyncResult> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    product.metadata = withoutProductLogoMetadata(product.metadata ?? {});
    await this.products.save(product);

    return {
      logoAssetId: null,
      logoUrl: null,
      logoSourceUrl: null,
      synced: true,
    };
  }

  private async tryDownloadLogo(
    tenantId: string,
    product: ProductEntity,
    sourceUrl: string,
  ): Promise<ProductLogoSyncResult | null> {
    try {
      const response = await fetch(sourceUrl, {
        headers: { Accept: 'image/*' },
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get('content-type') ?? 'image/png';
      if (!contentType.startsWith('image/')) {
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length === 0 || buffer.length > MAX_LOGO_BYTES) {
        return null;
      }

      const extension = contentType.includes('svg')
        ? 'svg'
        : contentType.includes('jpeg') || contentType.includes('jpg')
          ? 'jpg'
          : contentType.includes('webp')
            ? 'webp'
            : 'png';

      const fileName = `${product.slug}-logo.${extension}`;
      const fakeFile: Express.Multer.File = {
        buffer,
        originalname: fileName,
        mimetype: contentType.split(';')[0],
        size: buffer.length,
        fieldname: 'file',
        encoding: '7bit',
        stream: null as unknown as import('stream').Readable,
        destination: '',
        filename: fileName,
        path: '',
      };

      const asset = await this.assets.upload(tenantId, fakeFile);
      return this.attachLogoAsset(product, asset.id, sourceUrl);
    } catch (error) {
      this.logger.debug(
        `Logo candidate failed (${sourceUrl}): ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  private async attachLogoAsset(
    product: ProductEntity,
    assetId: string,
    sourceUrl: string | null,
  ): Promise<ProductLogoSyncResult> {
    product.metadata = withProductLogoMetadata(product.metadata ?? {}, assetId, sourceUrl);
    await this.products.save(product);

    return {
      logoAssetId: assetId,
      logoUrl: this.buildLogoUrl(assetId),
      logoSourceUrl: sourceUrl,
      synced: true,
    };
  }

  private buildLogoUrl(assetId: string | null): string | null {
    return assetId ? `/api/v1/assets/${assetId}/file` : null;
  }

  async syncFromPageHtml(
    tenantId: string,
    product: ProductEntity,
    html: string,
    pageUrl: string,
  ): Promise<void> {
    if (getProductLogoAssetId(product.metadata)) {
      return;
    }

    const candidates = extractLogoCandidates(html, normalizePageUrl(pageUrl));
    for (const candidate of candidates) {
      const stored = await this.tryDownloadLogo(tenantId, product, candidate);
      if (stored?.synced) {
        return;
      }
    }
  }
}
