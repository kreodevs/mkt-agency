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
import { AssetFolderEntity } from './infrastructure/typeorm/asset-folder.entity';
import { AssetEntity } from './infrastructure/typeorm/asset.entity';

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
