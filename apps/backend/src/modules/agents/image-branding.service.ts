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
    try {
      const base = sharp(imageBuffer);
      const metadata = await base.metadata();
      const width = metadata.width ?? 1024;
      const height = metadata.height ?? 1024;

      const logoFile = await this.assets.readFile(tenantId, logoAssetId);
      const logoWidth = Math.max(96, Math.round(width * 0.16));
      const logoBuffer = await sharp(logoFile.buffer)
        .resize({ width: logoWidth, withoutEnlargement: true })
        .png()
        .toBuffer();

      const padding = Math.round(width * 0.04);

      return base
        .composite([
          {
            input: logoBuffer,
            top: padding,
            left: Math.max(padding, width - logoWidth - padding),
          },
        ])
        .png()
        .toBuffer();
    } catch (error) {
      this.logger.warn(
        `Logo overlay failed for asset ${logoAssetId}: ${error instanceof Error ? error.message : error}`,
      );
      return imageBuffer;
    }
  }
}
