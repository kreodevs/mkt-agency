import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAssetTagDto } from './dto/asset.request.dto';
import { AssetTagResponseDto, AssetTagsListResponseDto } from './dto/asset.response.dto';
import { AssetTagEntity } from './infrastructure/typeorm/asset-tag.entity';

@Injectable()
export class AssetTagService {
  constructor(
    @InjectRepository(AssetTagEntity)
    private readonly tags: Repository<AssetTagEntity>,
  ) {}

  async list(tenantId: string): Promise<AssetTagsListResponseDto> {
    const items = await this.tags.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });

    return {
      items: items.map((tag) => this.toResponse(tag)),
    };
  }

  async create(tenantId: string, dto: CreateAssetTagDto): Promise<AssetTagResponseDto> {
    const existing = await this.tags.findOne({ where: { tenantId, name: dto.name } });
    if (existing) {
      return this.toResponse(existing);
    }

    const saved = await this.tags.save(
      this.tags.create({ tenantId, name: dto.name.trim() }),
    );

    return this.toResponse(saved);
  }

  private toResponse(tag: AssetTagEntity): AssetTagResponseDto {
    return { id: tag.id, name: tag.name };
  }
}
