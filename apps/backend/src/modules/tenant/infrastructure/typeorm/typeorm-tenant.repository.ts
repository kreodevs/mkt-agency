import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateTenantData,
  ListTenantsParams,
  ListTenantsResult,
  Tenant,
  TenantRepositoryPort,
  UpdateTenantData,
} from '../../domain/tenant.repository.port';
import { TenantEntity } from './tenant.entity';

@Injectable()
export class TypeOrmTenantRepository implements TenantRepositoryPort {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
  ) {}

  async findById(id: string): Promise<Tenant | null> {
    const tenant = await this.tenants.findOne({ where: { id } });
    return tenant ? this.toDomain(tenant) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const tenant = await this.tenants.findOne({ where: { slug } });
    return tenant ? this.toDomain(tenant) : null;
  }

  async list(params: ListTenantsParams): Promise<ListTenantsResult> {
    const { page, limit, status, plan } = params;
    const skip = (page - 1) * limit;

    const query = this.tenants.createQueryBuilder('tenant');

    if (status) {
      query.andWhere('tenant.status = :status', { status });
    }

    if (plan) {
      query.andWhere('tenant.plan = :plan', { plan });
    }

    query.orderBy('tenant.created_at', 'DESC').skip(skip).take(limit);

    const [entities, total] = await query.getManyAndCount();

    return {
      items: entities.map((entity) => this.toDomain(entity)),
      total,
      page,
      limit,
    };
  }

  async create(data: CreateTenantData): Promise<Tenant> {
    const entity = this.tenants.create({
      name: data.name,
      slug: data.slug,
      plan: data.plan,
      status: 'active',
      settings: {},
    });

    const saved = await this.tenants.save(entity);
    return this.toDomain(saved);
  }

  async update(id: string, data: UpdateTenantData): Promise<Tenant | null> {
    const entity = await this.tenants.findOne({ where: { id } });
    if (!entity) {
      return null;
    }

    if (data.plan !== undefined) {
      entity.plan = data.plan;
    }
    if (data.packageId !== undefined) {
      entity.packageId = data.packageId;
    }
    if (data.status !== undefined) {
      entity.status = data.status;
    }
    if (data.settings !== undefined) {
      entity.settings = data.settings;
    }
    if (data.maxUsers !== undefined) {
      entity.maxUsers = data.maxUsers;
    }
    if (data.maxAssetsSize !== undefined) {
      entity.maxAssetsSize = String(data.maxAssetsSize);
    }
    if (data.maxFileSize !== undefined) {
      entity.maxFileSize = String(data.maxFileSize);
    }

    const saved = await this.tenants.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.tenants.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  private toDomain(entity: TenantEntity): Tenant {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      plan: entity.plan,
      packageId: entity.packageId,
      status: entity.status,
      settings: entity.settings,
      maxUsers: entity.maxUsers,
      maxAssetsSize: Number(entity.maxAssetsSize),
      maxFileSize: Number(entity.maxFileSize),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
