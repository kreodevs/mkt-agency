import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../shared/infrastructure/typeorm/user.entity';
import { TenantPlatformAdminEntity } from '../infrastructure/typeorm/tenant-platform-admin.entity';

export interface TenantPlatformAdminSummary {
  id: string;
  email: string;
  name: string;
}

@Injectable()
export class TenantPlatformAdminService {
  constructor(
    @InjectRepository(TenantPlatformAdminEntity)
    private readonly assignments: Repository<TenantPlatformAdminEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async listForTenant(tenantId: string): Promise<TenantPlatformAdminSummary[]> {
    const rows = await this.assignments.find({
      where: { tenantId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return rows
      .filter((row) => row.user?.status === 'active')
      .map((row) => ({
        id: row.user.id,
        email: row.user.email,
        name: row.user.name,
      }));
  }

  async replaceForTenant(tenantId: string, userIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(userIds)];

    for (const userId of uniqueIds) {
      const user = await this.users.findOne({ where: { id: userId } });
      if (!user?.isSuperadmin || user.status !== 'active') {
        throw new BadRequestException({
          error: 'Solo superadmins activos pueden ser administradores de plataforma del tenant',
          code: 'VALIDATION_ERROR',
        });
      }
    }

    await this.assignments.delete({ tenantId });

    if (uniqueIds.length === 0) {
      return;
    }

    await this.assignments.save(
      uniqueIds.map((userId) =>
        this.assignments.create({
          tenantId,
          userId,
        }),
      ),
    );
  }
}
