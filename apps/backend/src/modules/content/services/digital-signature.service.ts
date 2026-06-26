import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ContentVersionEntity } from '../infrastructure/typeorm/content-version.entity';

@Injectable()
export class DigitalSignatureService {
  compute(version: ContentVersionEntity): string {
    const assetIds = this.extractAssetIds(version.assets);
    const payload = `${version.body}|${version.id}|${assetIds.join(',')}`;
    return createHash('sha256').update(payload, 'utf8').digest('hex');
  }

  private extractAssetIds(assets: unknown[]): string[] {
    const ids: string[] = [];

    for (const asset of assets) {
      if (typeof asset === 'string') {
        ids.push(asset);
      } else if (asset && typeof asset === 'object' && 'id' in asset) {
        ids.push(String((asset as { id: unknown }).id));
      }
    }

    return ids.sort();
  }
}
