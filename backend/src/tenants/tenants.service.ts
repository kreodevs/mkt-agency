import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async create(dto: CreateTenantDto, ownerId: string): Promise<Tenant> {
    const tenant = this.tenantRepo.create({ ...dto, ownerId });
    return this.tenantRepo.save(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepo.find({ where: { isActive: true } });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id }, relations: ['products'] });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    await this.tenantRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.tenantRepo.update(id, { isActive: false });
  }
}