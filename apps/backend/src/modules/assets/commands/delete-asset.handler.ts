import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  STORAGE_ADAPTER,
  StorageAdapterPort,
} from '../infrastructure/adapters/storage.adapter.port';
import { AssetTagAssignmentEntity } from '../infrastructure/typeorm/asset-tag-assignment.entity';
import { AssetEntity } from '../infrastructure/typeorm/asset.entity';
import { DeleteAssetCommand } from './delete-asset.command';

@Injectable()
export class DeleteAssetHandler {
  constructor(
    @InjectRepository(AssetEntity)
    private readonly assets: Repository<AssetEntity>,
    @InjectRepository(AssetTagAssignmentEntity)
    private readonly tagAssignments: Repository<AssetTagAssignmentEntity>,
    @Inject(STORAGE_ADAPTER)
    private readonly storage: StorageAdapterPort,
  ) {}

  async execute(command: DeleteAssetCommand): Promise<void> {
    const asset = await this.assets.findOne({
      where: { id: command.assetId, tenantId: command.tenantId },
    });

    if (!asset) {
      throw new NotFoundException({
        error: 'Asset not found',
        code: 'NOT_FOUND',
      });
    }

    if (asset.isInUse || asset.referenceCount > 0) {
      throw new ConflictException({
        error: 'Asset is referenced by approved content and cannot be deleted',
        code: 'ASSET_IN_USE',
      });
    }

    const fileKey = asset.fileKey;
    await this.tagAssignments.delete({ assetId: asset.id });
    await this.assets.remove(asset);

    const remaining = await this.assets.count({ where: { fileKey } });
    if (remaining === 0) {
      await this.storage.deleteObject(fileKey).catch(() => undefined);
    }
  }
}
