import { execFile } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetService } from '../assets/asset.service';
import { AssetEntity } from '../assets/infrastructure/typeorm/asset.entity';
import { ContentService } from '../content/content.service';
import { normalizeContentVisualFormat } from '../content/domain/content-visual-format.util';
import { isFfmpegAvailable, resolveFfmpegPath } from '../agents/domain/video-ffmpeg.util';
import type { SocialCopyPost } from '../community-manager/adapters/social-copy.adapter.port';
import { ProductMediaKitItemEntity } from '../product/infrastructure/typeorm/product-media-kit-item.entity';
import { ProductMediaKitService } from '../product/product-media-kit.service';

const execFileAsync = promisify(execFile);

export type ComposeVisualResult = {
  attached: boolean;
  mode: 'compose' | 'skipped';
  assetIds: string[];
};

@Injectable()
export class ContentVisualComposerService {
  private readonly logger = new Logger(ContentVisualComposerService.name);

  constructor(
    private readonly contentService: ContentService,
    private readonly assetService: AssetService,
    private readonly mediaKit: ProductMediaKitService,
    @InjectRepository(AssetEntity)
    private readonly assets: Repository<AssetEntity>,
  ) {}

  async tryComposeFromKit(
    tenantId: string,
    userId: string,
    contentId: string,
    post: Pick<SocialCopyPost, 'visualFormat'>,
    productId: string | undefined,
    kit: ProductMediaKitItemEntity[],
    postIndex: number,
  ): Promise<ComposeVisualResult> {
    if (!productId || !kit.length) {
      return { attached: false, mode: 'skipped', assetIds: [] };
    }

    const visualFormat = normalizeContentVisualFormat(post.visualFormat);

    if (visualFormat === 'video') {
      const videoAssetId = await this.resolveVideoAsset(tenantId, kit, postIndex);
      if (videoAssetId) {
        await this.attachToContent(tenantId, userId, contentId, [videoAssetId], 'video');
        return { attached: true, mode: 'compose', assetIds: [videoAssetId] };
      }

      const imageIds = await this.mediaKit.pickImageAssetIdsForCompose(
        tenantId,
        kit,
        'video',
        postIndex,
      );
      if (imageIds.length) {
        const reelAssetId = await this.createKenBurnsFromImage(tenantId, imageIds[0]);
        if (reelAssetId) {
          await this.attachToContent(tenantId, userId, contentId, [reelAssetId], 'video');
          return { attached: true, mode: 'compose', assetIds: [reelAssetId] };
        }
        await this.attachToContent(tenantId, userId, contentId, [imageIds[0]], 'image');
        return { attached: true, mode: 'compose', assetIds: [imageIds[0]] };
      }

      return { attached: false, mode: 'skipped', assetIds: [] };
    }

    const imageIds = await this.mediaKit.pickImageAssetIdsForCompose(
      tenantId,
      kit,
      visualFormat,
      postIndex,
    );
    if (!imageIds.length) {
      return { attached: false, mode: 'skipped', assetIds: [] };
    }

    await this.attachToContent(
      tenantId,
      userId,
      contentId,
      imageIds,
      visualFormat === 'carousel' ? 'image' : 'image',
    );
    return { attached: true, mode: 'compose', assetIds: imageIds };
  }

  private async resolveVideoAsset(
    tenantId: string,
    kit: ProductMediaKitItemEntity[],
    postIndex: number,
  ): Promise<string | null> {
    const candidateId = this.mediaKit.pickVideoAssetId(kit, postIndex);
    if (!candidateId) {
      return null;
    }

    const asset = await this.assets.findOne({
      where: { id: candidateId, tenantId },
    });
    if (asset?.type === 'video') {
      return asset.id;
    }
    return null;
  }

  private async createKenBurnsFromImage(
    tenantId: string,
    imageAssetId: string,
  ): Promise<string | null> {
    if (!(await isFfmpegAvailable())) {
      return null;
    }

    const ffmpeg = await resolveFfmpegPath();
    if (!ffmpeg) {
      return null;
    }

    const imageFile = await this.assetService.readFile(tenantId, imageAssetId);
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'mkt-reel-'));
    const inputPath = path.join(tmpDir, 'frame.png');
    const outputPath = path.join(tmpDir, 'reel.mp4');

    try {
      await fs.promises.writeFile(inputPath, imageFile.buffer);
      await execFileAsync(
        ffmpeg,
        [
          '-y',
          '-loop',
          '1',
          '-i',
          inputPath,
          '-vf',
          'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z=1.08:d=150:s=1080x1920:fps=30',
          '-t',
          '5',
          '-pix_fmt',
          'yuv420p',
          '-an',
          outputPath,
        ],
        { timeout: 120_000 },
      );

      const videoBuffer = await fs.promises.readFile(outputPath);
      const uploaded = await this.assetService.uploadBuffer(
        tenantId,
        videoBuffer,
        'reel-kit-compose.mp4',
        'video/mp4',
      );
      return uploaded.id;
    } catch (error) {
      this.logger.warn(
        `Ken Burns reel failed for asset ${imageAssetId}: ${
          error instanceof Error ? error.message : error
        }`,
      );
      return null;
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private async attachToContent(
    tenantId: string,
    userId: string,
    contentId: string,
    assetIds: string[],
    mediaType: 'image' | 'video',
  ): Promise<void> {
    const changeSummary =
      mediaType === 'video'
        ? 'Reel compuesto con material real del producto'
        : assetIds.length > 1
          ? `Carrusel con ${assetIds.length} fotos reales del producto`
          : 'Visual con foto real del producto (kit de medios)';

    await this.contentService.update(tenantId, userId, contentId, {
      assets: assetIds,
      changeSummary,
    });
  }
}
