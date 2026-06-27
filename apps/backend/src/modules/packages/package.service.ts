import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreatePackageRequestDto,
  UpdatePackageRequestDto,
} from './dto/package.request.dto';
import {
  PackageListResponseDto,
  PackageResponseDto,
  toPackageResponse,
} from './dto/package.response.dto';
import { PackageEntity } from './infrastructure/typeorm/package.entity';

@Injectable()
export class PackageService {
  constructor(
    @InjectRepository(PackageEntity)
    private readonly packages: Repository<PackageEntity>,
  ) {}

  async list(includeInactive = false): Promise<PackageListResponseDto> {
    const items = await this.packages.find({
      where: includeInactive ? {} : { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return { items: items.map(toPackageResponse) };
  }

  async findById(id: string): Promise<PackageResponseDto> {
    const pkg = await this.packages.findOne({ where: { id } });
    if (!pkg) {
      throw new NotFoundException({
        error: 'Package not found',
        code: 'NOT_FOUND',
      });
    }
    return toPackageResponse(pkg);
  }

  async findEntityById(id: string): Promise<PackageEntity | null> {
    return this.packages.findOne({ where: { id } });
  }

  async findEntityBySlug(slug: string): Promise<PackageEntity | null> {
    return this.packages.findOne({ where: { slug } });
  }

  async create(body: CreatePackageRequestDto): Promise<PackageResponseDto> {
    const existing = await this.packages.findOne({
      where: { slug: body.slug.trim().toLowerCase() },
    });
    if (existing) {
      throw new ConflictException({
        error: 'Package slug already exists',
        code: 'CONFLICT',
      });
    }

    const saved = await this.packages.save(
      this.packages.create({
        slug: body.slug.trim().toLowerCase(),
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
        maxUsers: body.maxUsers,
        maxAssetsSize: String(body.maxAssetsSize),
        maxFileSize: String(body.maxFileSize),
        maxCampaigns: body.maxCampaigns ?? null,
        maxAiRequestsPerDay: body.maxAiRequestsPerDay ?? null,
        features: body.features ?? {},
        sortOrder: body.sortOrder ?? 0,
        isActive: true,
      }),
    );

    return toPackageResponse(saved);
  }

  async update(
    id: string,
    body: UpdatePackageRequestDto,
  ): Promise<PackageResponseDto> {
    const pkg = await this.packages.findOne({ where: { id } });
    if (!pkg) {
      throw new NotFoundException({
        error: 'Package not found',
        code: 'NOT_FOUND',
      });
    }

    if (body.name !== undefined) pkg.name = body.name.trim();
    if (body.description !== undefined) pkg.description = body.description;
    if (body.maxUsers !== undefined) pkg.maxUsers = body.maxUsers;
    if (body.maxAssetsSize !== undefined) {
      pkg.maxAssetsSize = String(body.maxAssetsSize);
    }
    if (body.maxFileSize !== undefined) {
      pkg.maxFileSize = String(body.maxFileSize);
    }
    if (body.maxCampaigns !== undefined) pkg.maxCampaigns = body.maxCampaigns;
    if (body.maxAiRequestsPerDay !== undefined) {
      pkg.maxAiRequestsPerDay = body.maxAiRequestsPerDay;
    }
    if (body.features !== undefined) pkg.features = body.features;
    if (body.isActive !== undefined) pkg.isActive = body.isActive;
    if (body.sortOrder !== undefined) pkg.sortOrder = body.sortOrder;

    const saved = await this.packages.save(pkg);
    return toPackageResponse(saved);
  }

  async remove(id: string): Promise<void> {
    const pkg = await this.packages.findOne({ where: { id } });
    if (!pkg) {
      throw new NotFoundException({
        error: 'Package not found',
        code: 'NOT_FOUND',
      });
    }

    await this.packages.delete({ id });
  }
}
