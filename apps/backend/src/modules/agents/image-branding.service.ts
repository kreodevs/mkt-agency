import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
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

    const logoWidth = Math.max(96, Math.round(width * 0.18));
    const logoBuffer = await this.rasterizeLogo(logoFile.buffer, logoFile.mimeType, logoWidth);
    const logoMeta = await sharp(logoBuffer).metadata();
    const logoW = logoMeta.width ?? logoWidth;
    const logoH = logoMeta.height ?? logoWidth;

    const padding = Math.round(width * 0.04);
    const platePad = Math.max(8, Math.round(Math.min(logoW, logoH) * 0.12));
    const plateW = logoW + platePad * 2;
    const plateH = logoH + platePad * 2;

    const plate = await sharp({
      create: {
        width: plateW,
        height: plateH,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0.88 },
      },
    })
      .png()
      .toBuffer();

    const top = padding;
    const left = Math.max(padding, width - plateW - padding);

    if (top + plateH > height || left + plateW > width) {
      throw new Error(
        `Logo plate exceeds image bounds (${width}x${height}) for asset ${logoAssetId}`,
      );
    }

    const composited = await base
      .composite([
        { input: plate, top, left },
        { input: logoBuffer, top: top + platePad, left: left + platePad },
      ])
      .png()
      .toBuffer();

    if (composited.length <= normalizedBase.length * 0.98) {
      this.logger.warn(`Logo composite may not have applied for asset ${logoAssetId}`);
    }

    return composited;
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

      return pipeline
        .resize({ width: targetWidth, fit: 'inside', withoutEnlargement: false })
        .ensureAlpha()
        .png()
        .toBuffer();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Logo rasterization failed (${mimeType}): ${message}`);
    }
  }
}
