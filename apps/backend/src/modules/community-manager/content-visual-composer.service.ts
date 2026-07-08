import { Injectable } from '@nestjs/common';
import { ContentService } from '../content/content.service';
import { normalizeContentVisualFormat } from '../content/domain/content-visual-format.util';
import type { SocialCopyPost } from '../community-manager/adapters/social-copy.adapter.port';
import { ProductMediaKitItemEntity } from '../product/infrastructure/typeorm/product-media-kit-item.entity';
import { ProductMediaKitService } from '../product/product-media-kit.service';

export type ComposeVisualResult = {
  attached: boolean;
  mode: 'compose' | 'skipped';
  assetIds: string[];
};

@Injectable()
export class ContentVisualComposerService {
  constructor(
    private readonly contentService: ContentService,
    private readonly mediaKit: ProductMediaKitService,
  ) {}

  async tryComposeFromKit(
    tenantId: string,
    userId: string,
    contentId: string,
    post: Pick<SocialCopyPost, 'visualFormat' | 'platform'>,
    productId: string | undefined,
    kit: ProductMediaKitItemEntity[],
    postIndex: number,
  ): Promise<ComposeVisualResult> {
    if (!productId || !kit.length) {
      return { attached: false, mode: 'skipped', assetIds: [] };
    }

    const visualFormat = normalizeContentVisualFormat(post.visualFormat);

    const imageIds = await this.mediaKit.pickImageAssetIdsForCompose(
      tenantId,
      kit,
      visualFormat,
      postIndex,
      post.platform,
    );
    if (!imageIds.length) {
      return { attached: false, mode: 'skipped', assetIds: [] };
    }

    const changeSummary =
      imageIds.length > 1
        ? `Carrusel con ${imageIds.length} fotos reales del producto`
        : 'Visual con foto real del producto (kit de medios)';

    await this.contentService.update(tenantId, userId, contentId, {
      assets: imageIds,
      changeSummary,
    });

    return { attached: true, mode: 'compose', assetIds: imageIds };
  }
}
