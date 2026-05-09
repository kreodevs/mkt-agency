import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantUser } from '../users/entities/tenant-user.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(TenantUser)
    private readonly tenantUserRepo: Repository<TenantUser>,
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

  async findUsers(tenantId: string) {
    return this.tenantUserRepo.find({
      where: { tenantId },
      relations: ['user'],
    }).then((items) =>
      items.map((tu) => ({
        id: tu.id,
        name: tu.user?.name,
        email: tu.user?.email,
        role: tu.role,
      }))
    );
  }

  async remove(id: string): Promise<void> {
    // Hard delete — cascade relations via TypeORM or manual cleanup
    await this.tenantUserRepo.delete({ tenantId: id });
    await this.tenantRepo.delete(id);
  }
}