import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAudienceDto, UpdateAudienceDto, ListAudiencesQueryDto } from './dto/campaign.request.dto';
import {
  AudienceResponseDto,
  PaginatedAudiencesResponseDto,
} from './dto/campaign.response.dto';
import { AudienceEntity } from './infrastructure/typeorm/audience.entity';

@Injectable()
export class AudienceService {
  constructor(
    @InjectRepository(AudienceEntity)
    private readonly audiences: Repository<AudienceEntity>,
  ) {}

  async list(
    tenantId: string,
    query: ListAudiencesQueryDto,
  ): Promise<PaginatedAudiencesResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.audiences.findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    };
  }

  async create(tenantId: string, dto: CreateAudienceDto): Promise<AudienceResponseDto> {
    const saved = await this.audiences.save(
      this.audiences.create({
        tenantId,
        name: dto.name,
        description: dto.description ?? null,
        criteria: dto.criteria ?? {},
        isActive: dto.isActive ?? true,
        isImmutable: false,
      }),
    );

    return this.toResponse(saved);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateAudienceDto,
  ): Promise<AudienceResponseDto> {
    const audience = await this.findOwned(tenantId, id);

    if (audience.isImmutable) {
      throw new ConflictException({
        error: 'Audience is immutable and cannot be updated',
        code: 'CONFLICT',
      });
    }

    Object.assign(audience, {
      name: dto.name ?? audience.name,
      description: dto.description ?? audience.description,
      criteria: dto.criteria ?? audience.criteria,
      isActive: dto.isActive ?? audience.isActive,
    });

    const saved = await this.audiences.save(audience);
    return this.toResponse(saved);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const audience = await this.findOwned(tenantId, id);

    if (audience.isImmutable) {
      throw new ConflictException({
        error: 'Audience is immutable and cannot be deleted',
        code: 'CONFLICT',
      });
    }

    await this.audiences.remove(audience);
  }

  private async findOwned(tenantId: string, id: string): Promise<AudienceEntity> {
    const audience = await this.audiences.findOne({ where: { id, tenantId } });
    if (!audience) {
      throw new NotFoundException({
        error: 'Audience not found',
        code: 'NOT_FOUND',
      });
    }

    return audience;
  }

  private toResponse(audience: AudienceEntity): AudienceResponseDto {
    return {
      id: audience.id,
      tenantId: audience.tenantId,
      name: audience.name,
      description: audience.description,
      criteria: audience.criteria,
      isActive: audience.isActive,
      isImmutable: audience.isImmutable,
      createdAt: audience.createdAt.toISOString(),
      updatedAt: audience.updatedAt.toISOString(),
    };
  }
}
