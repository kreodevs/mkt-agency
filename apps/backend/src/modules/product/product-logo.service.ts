import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import sharp from 'sharp';
import { Repository } from 'typeorm';
import { AssetService } from '../assets/asset.service';
import { fetchImageBuffer, isLikelyImageBuffer } from '../../shared/web/fetch-image.util';
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
      throw new BadRequestException({
        error:
          'No se encontró ningún logo en la página. Verifica la URL o sube el logo manualmente.',
        code: 'LOGO_NOT_FOUND',
      });
    }

    const failures: string[] = [];
    for (const candidate of candidates) {
      const stored = await this.tryDownloadLogo(tenantId, product, candidate, page.url);
      if (stored) {
        return stored;
      }
      failures.push(candidate);
    }

    this.logger.warn(
      `Logo sync failed for product ${productId}: ${failures.length} candidates rejected (${failures.slice(0, 3).join(', ')})`,
    );

    throw new BadRequestException({
      error:
        'No se pudo descargar un logo válido desde la página del producto. Prueba con otra URL o súbelo manualmente.',
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
    referer?: string,
  ): Promise<ProductLogoSyncResult | null> {
    try {
      const fetched = await fetchImageBuffer(sourceUrl, { referer });
      if (!fetched) {
        this.logger.debug(`Logo candidate fetch failed: ${sourceUrl}`);
        return null;
      }

      const { buffer, contentType } = fetched;
      if (buffer.length > MAX_LOGO_BYTES) {
        return null;
      }

      if (!(await this.isUsableLogoBuffer(buffer, contentType))) {
        this.logger.debug(`Skipping tiny or invalid logo candidate: ${sourceUrl}`);
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
      const stored = await this.tryDownloadLogo(tenantId, product, candidate, pageUrl);
      if (stored?.synced) {
        return;
      }
    }
  }

  private async isUsableLogoBuffer(buffer: Buffer, mimeType: string): Promise<boolean> {
    if (!isLikelyImageBuffer(buffer, mimeType)) {
      return false;
    }

    if (mimeType.includes('svg')) {
      return true;
    }

    try {
      const metadata = await sharp(buffer).metadata();
      const width = metadata.width ?? 0;
      const height = metadata.height ?? 0;
      if (width >= 24 && height >= 24) {
        return true;
      }
    } catch {
      // Sharp can fail on some PNG profiles; fall back to signature sniffing above.
    }

    return buffer.length >= 400;
  }
}
