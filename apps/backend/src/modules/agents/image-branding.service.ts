import { Injectable, Logger } from '@nestjs/common';
import type { Sharp } from 'sharp';
import sharp from '@/shared/media/sharp.util';
import { AssetService } from '../assets/asset.service';

@Injectable()
export class ImageBrandingService {
  private readonly logger = new Logger(ImageBrandingService.name);

  constructor(private readonly assets: AssetService) {}

  async applyProductLogo(
    tenantId: string,
    imageBuffer: Buffer,
    logoAssetId: string,
  ): Promise<Buffer> {
    const logoFile = await this.assets.readFile(tenantId, logoAssetId);
    const normalizedBase = await sharp(imageBuffer).ensureAlpha().png().toBuffer();
    const base = sharp(normalizedBase);
    const metadata = await base.metadata();
    const width = metadata.width ?? 1024;
    const height = metadata.height ?? 1024;

    const padding = Math.max(12, Math.round(Math.min(width, height) * 0.04));
    let logoWidth = Math.max(96, Math.round(Math.min(width, height) * 0.18));

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.compositeLogo(
          base,
          width,
          height,
          logoFile.buffer,
          logoFile.mimeType,
          logoWidth,
          padding,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('bounds') && attempt < 4) {
          logoWidth = Math.round(logoWidth * 0.75);
          this.logger.debug(
            `Retrying logo overlay for ${logoAssetId} at width ${logoWidth} (attempt ${attempt + 2})`,
          );
          continue;
        }
        throw error;
      }
    }

    throw new Error(`Logo overlay failed for asset ${logoAssetId}`);
  }

  private async compositeLogo(
    base: Sharp,
    width: number,
    height: number,
    logoBuffer: Buffer,
    mimeType: string,
    logoWidth: number,
    padding: number,
  ): Promise<Buffer> {
    const rasterizedLogo = await this.rasterizeLogo(logoBuffer, mimeType, logoWidth);
    const logoWithShadow = await this.withDropShadow(rasterizedLogo);
    const logoMeta = await sharp(logoWithShadow).metadata();
    const logoW = logoMeta.width ?? logoWidth;
    const logoH = logoMeta.height ?? logoWidth;

    const left = padding;
    const top = padding;

    if (top + logoH > height || left + logoW > width) {
      throw new Error(
        `Logo exceeds image bounds (${width}x${height}, logo ${logoW}x${logoH})`,
      );
    }

    return base
      .composite([{ input: logoWithShadow, top, left }])
      .png()
      .toBuffer();
  }

  /** Sombra suave para que el logo se lea sobre fondos claros u oscuros (sin placa blanca). */
  private async withDropShadow(logoPng: Buffer): Promise<Buffer> {
    const meta = await sharp(logoPng).metadata();
    const logoW = meta.width ?? 100;
    const logoH = meta.height ?? 100;
    const offset = Math.max(2, Math.round(Math.min(logoW, logoH) * 0.04));
    const pad = Math.max(4, offset * 2);
    const canvasW = logoW + pad * 2;
    const canvasH = logoH + pad * 2;

    const shadow = await sharp(logoPng)
      .ensureAlpha()
      .tint({ r: 0, g: 0, b: 0 })
      .linear(0.55, 0)
      .blur(3)
      .toBuffer();

    return sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: shadow, top: pad + offset, left: pad + offset },
        { input: logoPng, top: pad, left: pad },
      ])
      .png()
      .toBuffer();
  }

  private async rasterizeLogo(
    buffer: Buffer,
    mimeType: string,
    targetWidth: number,
  ): Promise<Buffer> {
    const isSvg =
      mimeType.includes('svg') ||
      buffer.slice(0, 256).toString('utf8').trimStart().startsWith('<');

    try {
      const pipeline = isSvg ? sharp(buffer, { density: 300 }) : sharp(buffer);

      try {
        return await pipeline
          .trim({ threshold: 10 })
          .resize({ width: targetWidth, fit: 'inside', withoutEnlargement: false })
          .ensureAlpha()
          .png()
          .toBuffer();
      } catch {
        return sharp(buffer)
          .resize({ width: targetWidth, fit: 'inside', withoutEnlargement: false })
          .ensureAlpha()
          .png()
          .toBuffer();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Logo rasterization failed (${mimeType}): ${message}`);
    }
  }
}
