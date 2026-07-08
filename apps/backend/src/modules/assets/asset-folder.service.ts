import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateAssetFolderDto,
  UpdateAssetFolderDto,
} from './dto/asset.request.dto';
import {
  AssetFolderResponseDto,
  AssetFoldersListResponseDto,
} from './dto/asset.response.dto';
import {
  buildFolderPathMap,
  inferDeviceFromFolderPath,
  type AssetDeviceHint,
} from './domain/asset-folder.util';
import { AssetFolderEntity } from './infrastructure/typeorm/asset-folder.entity';
import { AssetEntity } from './infrastructure/typeorm/asset.entity';

export type LibraryFolderSummary = {
  folderId: string;
  path: string;
  device: AssetDeviceHint | null;
  imageCount: number;
  videoCount: number;
};

@Injectable()
export class AssetFolderService {
  constructor(
    @InjectRepository(AssetFolderEntity)
    private readonly folders: Repository<AssetFolderEntity>,
    @InjectRepository(AssetEntity)
    private readonly assets: Repository<AssetEntity>,
  ) {}

  async list(tenantId: string): Promise<AssetFoldersListResponseDto> {
    const items = await this.folders.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });

    return { items: items.map((item) => this.toResponse(item)) };
  }

  async create(
    tenantId: string,
    dto: CreateAssetFolderDto,
  ): Promise<AssetFolderResponseDto> {
    if (dto.parentId) {
      await this.findOwnedFolder(tenantId, dto.parentId);
    }

    const saved = await this.folders.save(
      this.folders.create({
        tenantId,
        name: dto.name,
        parentId: dto.parentId ?? null,
      }),
    );

    return this.toResponse(saved);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateAssetFolderDto,
  ): Promise<AssetFolderResponseDto> {
    const folder = await this.findOwnedFolder(tenantId, id);

    if (dto.parentId !== undefined && dto.parentId === id) {
      throw new ConflictException({
        error: 'Folder cannot be its own parent',
        code: 'INVALID_FOLDER_PARENT',
      });
    }

    if (dto.parentId) {
      await this.findOwnedFolder(tenantId, dto.parentId);
    }

    if (dto.name !== undefined) folder.name = dto.name;
    if (dto.parentId !== undefined) folder.parentId = dto.parentId;

    const saved = await this.folders.save(folder);
    return this.toResponse(saved);
  }

  async buildLibrarySummaryForLlm(tenantId: string): Promise<LibraryFolderSummary[]> {
    const folders = await this.folders.find({ where: { tenantId } });
    if (!folders.length) {
      return [];
    }

    const pathMap = buildFolderPathMap(folders);
    const counts = await this.assets
      .createQueryBuilder('a')
      .select('a.folder_id', 'folderId')
      .addSelect('a.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('a.tenant_id = :tenantId', { tenantId })
      .andWhere('a.folder_id IS NOT NULL')
      .groupBy('a.folder_id')
      .addGroupBy('a.type')
      .getRawMany<{ folderId: string; type: string; count: string }>();

    const countByFolder = new Map<string, { imageCount: number; videoCount: number }>();
    for (const row of counts) {
      const current = countByFolder.get(row.folderId) ?? { imageCount: 0, videoCount: 0 };
      const amount = Number(row.count) || 0;
      if (row.type === 'image') {
        current.imageCount += amount;
      } else if (row.type === 'video') {
        current.videoCount += amount;
      }
      countByFolder.set(row.folderId, current);
    }

    return folders
      .map((folder) => {
        const path = pathMap.get(folder.id) ?? folder.name;
        const folderCounts = countByFolder.get(folder.id) ?? { imageCount: 0, videoCount: 0 };
        return {
          folderId: folder.id,
          path,
          device: inferDeviceFromFolderPath(path),
          imageCount: folderCounts.imageCount,
          videoCount: folderCounts.videoCount,
        };
      })
      .filter((entry) => entry.imageCount > 0 || entry.videoCount > 0)
      .sort((a, b) => a.path.localeCompare(b.path, 'es'));
  }

  resolveFolderPath(
    folders: Pick<AssetFolderEntity, 'id' | 'name' | 'parentId'>[],
    folderId: string | null,
  ): { path: string | null; device: AssetDeviceHint | null } {
    if (!folderId) {
      return { path: null, device: null };
    }
    const pathMap = buildFolderPathMap(folders);
    const path = pathMap.get(folderId) ?? null;
    return {
      path,
      device: path ? inferDeviceFromFolderPath(path) : null,
    };
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const folder = await this.findOwnedFolder(tenantId, id);

    const childCount = await this.folders.count({ where: { parentId: id, tenantId } });
    const assetCount = await this.assets.count({ where: { folderId: id, tenantId } });

    if (childCount > 0 || assetCount > 0) {
      throw new ConflictException({
        error: 'Folder is not empty',
        code: 'FOLDER_NOT_EMPTY',
      });
    }

    await this.folders.remove(folder);
  }

  private async findOwnedFolder(tenantId: string, id: string): Promise<AssetFolderEntity> {
    const folder = await this.folders.findOne({ where: { id, tenantId } });
    if (!folder) {
      throw new NotFoundException({
        error: 'Folder not found',
        code: 'NOT_FOUND',
      });
    }
    return folder;
  }

  private toResponse(folder: AssetFolderEntity): AssetFolderResponseDto {
    return {
      id: folder.id,
      tenantId: folder.tenantId,
      parentId: folder.parentId,
      name: folder.name,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    };
  }
}
