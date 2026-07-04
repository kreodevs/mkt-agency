import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { In, Repository } from 'typeorm';
import { DeleteAssetCommand } from './commands/delete-asset.command';
import { DeleteAssetHandler } from './commands/delete-asset.handler';
import {
  inferAssetType,
  MAX_ASSET_FILE_SIZE,
} from './domain/asset.constants';
import { TenantLimitsService } from '../packages/services/tenant-limits.service';
import { ListAssetsQueryDto, UpdateAssetDto } from './dto/asset.request.dto';
import {
  AssetDownloadUrlResponseDto,
  AssetResponseDto,
  PaginatedAssetsResponseDto,
} from './dto/asset.response.dto';
import {
  STORAGE_ADAPTER,
  StorageAdapterPort,
} from './infrastructure/adapters/storage.adapter.port';
import { AssetTagAssignmentEntity } from './infrastructure/typeorm/asset-tag-assignment.entity';
import { AssetTagEntity } from './infrastructure/typeorm/asset-tag.entity';
import { AssetEntity } from './infrastructure/typeorm/asset.entity';

const DOWNLOAD_URL_TTL_SECONDS = 3600;

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(AssetEntity)
    private readonly assets: Repository<AssetEntity>,
    @InjectRepository(AssetTagEntity)
    private readonly tags: Repository<AssetTagEntity>,
    @InjectRepository(AssetTagAssignmentEntity)
    private readonly tagAssignments: Repository<AssetTagAssignmentEntity>,
    @Inject(STORAGE_ADAPTER)
    private readonly storage: StorageAdapterPort,
    private readonly deleteAssetHandler: DeleteAssetHandler,
    private readonly tenantLimitsService: TenantLimitsService,
  ) {}

  async list(tenantId: string, query: ListAssetsQueryDto): Promise<PaginatedAssetsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.assets
      .createQueryBuilder('a')
      .where('a.tenant_id = :tenantId', { tenantId })
      .orderBy('a.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.folderId) {
      qb.andWhere('a.folder_id = :folderId', { folderId: query.folderId });
    }

    if (query.type) {
      qb.andWhere('a.type = :type', { type: query.type });
    }

    if (query.tagIds) {
      const tagIds = query.tagIds.split(',').map((id) => id.trim()).filter(Boolean);
      if (tagIds.length) {
        qb.andWhere(
          `EXISTS (
            SELECT 1 FROM asset_tag_assignments ata
            WHERE ata.asset_id = a.id AND ata.tag_id IN (:...tagIds)
          )`,
          { tagIds },
        );
      }
    }

    const [items, total] = await qb.getManyAndCount();
    const enriched = await Promise.all(items.map((item) => this.toResponse(item)));

    return { items: enriched, total, page, limit };
  }

  async findOne(tenantId: string, id: string): Promise<AssetResponseDto> {
    const asset = await this.findOwnedAsset(tenantId, id);
    return this.toResponse(asset);
  }

  async upload(
    tenantId: string,
    file: Express.Multer.File,
    folderId?: string,
    tagIdsRaw?: string,
  ): Promise<AssetResponseDto> {
    if (!file?.buffer?.length) {
      throw new BadRequestException({
        error: 'File is required',
        code: 'VALIDATION_ERROR',
      });
    }

    if (file.size > MAX_ASSET_FILE_SIZE) {
      throw new PayloadTooLargeException({
        error: 'File size exceeds platform maximum',
        code: 'PAYLOAD_TOO_LARGE',
        maxSize: MAX_ASSET_FILE_SIZE,
      });
    }

    await this.tenantLimitsService.assertCanUpload(tenantId, file.size);

    const mimeType = file.mimetype || 'application/octet-stream';
    const fileKey = `tenants/${tenantId}/${randomUUID()}/${file.originalname}`;
    await this.storage.upload({
      key: fileKey,
      body: file.buffer,
      contentType: mimeType,
    });

    const saved = await this.assets.save(
      this.assets.create({
        tenantId,
        folderId: folderId ?? null,
        name: file.originalname,
        type: inferAssetType(mimeType),
        mimeType,
        fileKey,
        fileSize: String(file.size),
        url: '',
        metadata: {},
        referenceCount: 0,
        isInUse: false,
      }),
    );

    const tagIds = this.parseTagIds(tagIdsRaw);
    if (tagIds.length) {
      await this.syncTags(tenantId, saved.id, tagIds);
    }

    saved.url = this.buildApiFileUrl(saved.id);
    await this.assets.save(saved);

    return this.toResponse(saved);
  }

  async uploadBuffer(
    tenantId: string,
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<AssetResponseDto> {
    if (!buffer.length) {
      throw new BadRequestException({
        error: 'File is required',
        code: 'VALIDATION_ERROR',
      });
    }

    if (buffer.length > MAX_ASSET_FILE_SIZE) {
      throw new PayloadTooLargeException({
        error: 'File size exceeds platform maximum',
        code: 'PAYLOAD_TOO_LARGE',
        maxSize: MAX_ASSET_FILE_SIZE,
      });
    }

    await this.tenantLimitsService.assertCanUpload(tenantId, buffer.length);

    const fileKey = `tenants/${tenantId}/${randomUUID()}/${filename}`;
    await this.storage.upload({
      key: fileKey,
      body: buffer,
      contentType: mimeType,
    });

    const saved = await this.assets.save(
      this.assets.create({
        tenantId,
        folderId: null,
        name: filename,
        type: inferAssetType(mimeType),
        mimeType,
        fileKey,
        fileSize: String(buffer.length),
        url: '',
        metadata: { source: 'kit-compose' },
        referenceCount: 0,
        isInUse: false,
      }),
    );

    saved.url = this.buildApiFileUrl(saved.id);
    await this.assets.save(saved);

    return this.toResponse(saved);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    const asset = await this.findOwnedAsset(tenantId, id);

    if (dto.name !== undefined) asset.name = dto.name;
    if (dto.folderId !== undefined) asset.folderId = dto.folderId;

    const saved = await this.assets.save(asset);

    if (dto.tagIds !== undefined) {
      await this.syncTags(tenantId, saved.id, dto.tagIds);
    }

    return this.toResponse(saved);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.deleteAssetHandler.execute(new DeleteAssetCommand(tenantId, id));
  }

  async getDownloadUrl(
    tenantId: string,
    id: string,
  ): Promise<AssetDownloadUrlResponseDto> {
    const asset = await this.findOwnedAsset(tenantId, id);
    const url = await this.storage.getSignedDownloadUrl(
      asset.fileKey,
      DOWNLOAD_URL_TTL_SECONDS,
    );

    return { url, expiresIn: DOWNLOAD_URL_TTL_SECONDS };
  }

  async readFile(
    tenantId: string,
    id: string,
  ): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
    const asset = await this.findOwnedAsset(tenantId, id);
    const buffer = await this.storage.readObject(asset.fileKey);

    return {
      buffer,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      fileName: asset.name,
    };
  }

  async duplicate(tenantId: string, id: string): Promise<AssetResponseDto> {
    const source = await this.findOwnedAsset(tenantId, id);

    source.referenceCount += 1;
    await this.assets.save(source);

    const copy = await this.assets.save(
      this.assets.create({
        tenantId,
        folderId: source.folderId,
        name: `${source.name} (copia)`,
        type: source.type,
        mimeType: source.mimeType,
        fileKey: source.fileKey,
        fileSize: source.fileSize,
        url: source.url,
        metadata: { ...source.metadata, duplicatedFrom: source.id },
        referenceCount: 0,
        isInUse: false,
      }),
    );

    const sourceTags = await this.tagAssignments.find({ where: { assetId: source.id } });
    if (sourceTags.length) {
      await this.tagAssignments.save(
        sourceTags.map((row) =>
          this.tagAssignments.create({ assetId: copy.id, tagId: row.tagId }),
        ),
      );
    }

    return this.toResponse(copy);
  }

  private buildApiFileUrl(assetId: string): string {
    return `/api/v1/assets/${assetId}/file`;
  }

  private async findOwnedAsset(tenantId: string, id: string): Promise<AssetEntity> {
    const asset = await this.assets.findOne({ where: { id, tenantId } });
    if (!asset) {
      throw new NotFoundException({
        error: 'Asset not found',
        code: 'NOT_FOUND',
      });
    }
    return asset;
  }

  private parseTagIds(raw?: string): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return raw.split(',').map((id) => id.trim()).filter(Boolean);
    }
    return [];
  }

  private async syncTags(
    tenantId: string,
    assetId: string,
    tagIds: string[],
  ): Promise<void> {
    if (tagIds.length) {
      const ownedTags = await this.tags.find({
        where: { id: In(tagIds), tenantId },
      });
      if (ownedTags.length !== tagIds.length) {
        throw new BadRequestException({
          error: 'One or more tags are invalid',
          code: 'VALIDATION_ERROR',
        });
      }
    }

    await this.tagAssignments.delete({ assetId });
    if (tagIds.length) {
      await this.tagAssignments.save(
        tagIds.map((tagId) => this.tagAssignments.create({ assetId, tagId })),
      );
    }
  }

  private async toResponse(asset: AssetEntity): Promise<AssetResponseDto> {
    const assignments = await this.tagAssignments.find({ where: { assetId: asset.id } });
    const tagIds = assignments.map((row) => row.tagId);
    const tagRows =
      tagIds.length > 0
        ? await this.tags.find({ where: { id: In(tagIds) } })
        : [];

    return {
      id: asset.id,
      tenantId: asset.tenantId,
      folderId: asset.folderId,
      name: asset.name,
      type: asset.type,
      mimeType: asset.mimeType,
      fileKey: asset.fileKey,
      fileSize: Number(asset.fileSize),
      url: this.buildApiFileUrl(asset.id),
      metadata: asset.metadata,
      referenceCount: asset.referenceCount,
      isInUse: asset.isInUse,
      tags: tagRows.map((tag) => ({ id: tag.id, name: tag.name })),
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    };
  }
}
