import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppScreenshotCaptureService } from './app-screenshot-capture.service';
import {
  getProductAppCaptureConfig,
  isProductAppCaptureConfigured,
  withProductAppCaptureMetadata,
} from './domain/product-app-capture.metadata.util';
import {
  ProductAppCaptureResponseDto,
  ProductAppCaptureRunResponseDto,
  UpdateProductAppCaptureDto,
} from './dto/product-app-capture.dto';
import { ProductEntity } from './infrastructure/typeorm/product.entity';
import { ProductMediaKitService } from './product-media-kit.service';

const MASKED_PASSWORD = '••••••••';
const MIN_SCREENSHOTS_FOR_GENERATE = 3;

@Injectable()
export class ProductAppCaptureService {
  private readonly logger = new Logger(ProductAppCaptureService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    private readonly captureService: AppScreenshotCaptureService,
    private readonly mediaKitService: ProductMediaKitService,
  ) {}

  async getConfig(tenantId: string, productId: string): Promise<ProductAppCaptureResponseDto> {
    const product = await this.findOwnedProduct(tenantId, productId);
    return this.toResponse(product);
  }

  async updateConfig(
    tenantId: string,
    productId: string,
    dto: UpdateProductAppCaptureDto,
  ): Promise<ProductAppCaptureResponseDto> {
    const product = await this.findOwnedProduct(tenantId, productId);
    const current = getProductAppCaptureConfig(product.metadata);
    const metadata = { ...(product.metadata ?? {}) };

    let password = current.password;
    if (dto.password !== undefined) {
      if (dto.password && dto.password !== MASKED_PASSWORD) {
        password = dto.password;
      } else if (!dto.password) {
        password = null;
      }
    }

    product.metadata = withProductAppCaptureMetadata(metadata, {
      ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      ...(dto.loginUrl !== undefined ? { loginUrl: dto.loginUrl?.trim() || null } : {}),
      ...(dto.appUrl !== undefined ? { appUrl: dto.appUrl?.trim() || null } : {}),
      ...(dto.email !== undefined ? { email: dto.email?.trim() || null } : {}),
      ...(password !== current.password ? { password } : {}),
      ...(dto.emailSelector !== undefined
        ? { emailSelector: dto.emailSelector?.trim() || null }
        : {}),
      ...(dto.passwordSelector !== undefined
        ? { passwordSelector: dto.passwordSelector?.trim() || null }
        : {}),
      ...(dto.submitSelector !== undefined
        ? { submitSelector: dto.submitSelector?.trim() || null }
        : {}),
      ...(dto.postLoginWaitMs !== undefined ? { postLoginWaitMs: dto.postLoginWaitMs } : {}),
      ...(dto.screens !== undefined ? { screens: dto.screens } : {}),
      ...(dto.autoCaptureBeforeGenerate !== undefined
        ? { autoCaptureBeforeGenerate: dto.autoCaptureBeforeGenerate }
        : {}),
    });

    await this.products.save(product);
    return this.toResponse(product);
  }

  async runCapture(
    tenantId: string,
    productId: string,
  ): Promise<ProductAppCaptureRunResponseDto> {
    const product = await this.findOwnedProduct(tenantId, productId);
    const config = getProductAppCaptureConfig(product.metadata);

    if (!isProductAppCaptureConfigured(product.metadata)) {
      throw new BadRequestException({
        error: 'Activa la captura y completa login, app, email y contraseña.',
        code: 'CAPTURE_NOT_CONFIGURED',
      });
    }

    try {
      const screenshots = await this.captureService.capture(config);
      const items = [];

      for (const shot of screenshots) {
        const item = await this.mediaKitService.uploadBufferToKit(
          tenantId,
          productId,
          shot.buffer,
          shot.filename,
          'product-screenshot',
          shot.label,
        );
        items.push({ id: item.id, label: item.label, assetId: item.assetId });
      }

      product.metadata = withProductAppCaptureMetadata(product.metadata ?? {}, {
        lastCaptureAt: new Date().toISOString(),
        lastCaptureStatus: 'success',
        lastCaptureError: null,
        lastCaptureCount: items.length,
      });
      await this.products.save(product);

      return {
        status: 'success',
        capturedCount: items.length,
        items,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido al capturar';
      this.logger.warn(`Captura fallida para producto ${productId}: ${message}`);

      product.metadata = withProductAppCaptureMetadata(product.metadata ?? {}, {
        lastCaptureAt: new Date().toISOString(),
        lastCaptureStatus: 'failed',
        lastCaptureError: message.slice(0, 2000),
        lastCaptureCount: 0,
      });
      await this.products.save(product);

      return {
        status: 'failed',
        capturedCount: 0,
        items: [],
        error: message,
      };
    }
  }

  async ensureScreenshotsBeforeGenerate(tenantId: string, productId: string): Promise<void> {
    const product = await this.findOwnedProduct(tenantId, productId);
    const config = getProductAppCaptureConfig(product.metadata);
    if (!config.enabled || !config.autoCaptureBeforeGenerate) return;
    if (!isProductAppCaptureConfigured(product.metadata)) return;

    const screenshotCount = await this.mediaKitService.countKitItemsByRole(
      tenantId,
      productId,
      'product-screenshot',
    );
    if (screenshotCount >= MIN_SCREENSHOTS_FOR_GENERATE) return;

    this.logger.log(
      `Auto-captura de app para producto ${productId} (${screenshotCount}/${MIN_SCREENSHOTS_FOR_GENERATE} capturas)`,
    );
    const result = await this.runCapture(tenantId, productId);
    if (result.status === 'failed') {
      this.logger.warn(`Auto-captura fallida: ${result.error ?? 'sin detalle'}`);
    }
  }

  private async findOwnedProduct(tenantId: string, productId: string): Promise<ProductEntity> {
    const product = await this.products.findOne({ where: { id: productId, tenantId } });
    if (!product) {
      throw new NotFoundException({ error: 'Producto no encontrado', code: 'NOT_FOUND' });
    }
    return product;
  }

  private async toResponse(product: ProductEntity): Promise<ProductAppCaptureResponseDto> {
    const config = getProductAppCaptureConfig(product.metadata);
    const screenshotCountInKit = await this.mediaKitService.countKitItemsByRole(
      product.tenantId,
      product.id,
      'product-screenshot',
    );

    return {
      enabled: config.enabled,
      loginUrl: config.loginUrl,
      appUrl: config.appUrl,
      email: config.email,
      hasPassword: Boolean(config.password),
      password: config.password ? MASKED_PASSWORD : null,
      emailSelector: config.emailSelector,
      passwordSelector: config.passwordSelector,
      submitSelector: config.submitSelector,
      postLoginWaitMs: config.postLoginWaitMs,
      screens: config.screens,
      autoCaptureBeforeGenerate: config.autoCaptureBeforeGenerate,
      configured: isProductAppCaptureConfigured(product.metadata),
      lastCaptureAt: config.lastCaptureAt,
      lastCaptureStatus: config.lastCaptureStatus,
      lastCaptureError: config.lastCaptureError,
      lastCaptureCount: config.lastCaptureCount,
      screenshotCountInKit,
    };
  }
}
