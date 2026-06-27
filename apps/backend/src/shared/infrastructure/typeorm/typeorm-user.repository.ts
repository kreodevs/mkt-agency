import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TenantEntity } from '../../../modules/tenant/infrastructure/typeorm/tenant.entity';
import { UserRepositoryPort } from '../../domain/user.repository.port';
import {
  AuthUserRecord,
  CreateSuperadminParams,
  CreatedSuperadmin,
  CreateTenantOwnerParams,
  CreatedTenantOwner,
  PublicUserRecord,
} from '../../domain/user.types';
import { UserEntity } from '../typeorm/user.entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async countSuperadmins(): Promise<number> {
    return this.users.count({
      where: { isSuperadmin: true },
    });
  }

  async createSuperadmin(
    params: CreateSuperadminParams,
  ): Promise<CreatedSuperadmin> {
    const user = this.users.create({
      email: params.email,
      name: params.name,
      passwordHash: params.passwordHash,
      isSuperadmin: true,
      tenantId: null,
      role: 'owner',
      status: 'active',
    });

    const saved = await this.users.save(user);

    return {
      id: saved.id,
      email: saved.email,
      name: saved.name,
      isSuperadmin: true,
    };
  }

  async createTenantOwner(
    params: CreateTenantOwnerParams,
  ): Promise<CreatedTenantOwner> {
    const user = this.users.create({
      email: params.email,
      name: params.name,
      passwordHash: params.passwordHash,
      isSuperadmin: false,
      tenantId: params.tenantId,
      role: 'owner',
      status: 'active',
    });

    const saved = await this.users.save(user);

    return {
      id: saved.id,
      email: saved.email,
      name: saved.name,
      role: saved.role,
      tenantId: saved.tenantId!,
    };
  }

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const user = await this.users
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();

    if (!user) {
      return null;
    }

    let tenantStatus: string | null = null;
    if (user.tenantId) {
      const tenant = await this.dataSource
        .getRepository(TenantEntity)
        .findOne({ where: { id: user.tenantId } });
      tenantStatus = tenant?.status ?? null;
    }

    return this.toAuthUser(user, tenantStatus);
  }

  async findPublicById(id: string): Promise<PublicUserRecord | null> {
    const user = await this.users.findOne({ where: { id } });
    return user ? this.toPublicUser(user) : null;
  }

  async findPublicByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<PublicUserRecord | null> {
    const user = await this.users.findOne({
      where: { id, tenantId, isSuperadmin: false },
    });
    return user ? this.toPublicUser(user) : null;
  }

  async incrementLoginAttempts(userId: string): Promise<number> {
    await this.users.increment({ id: userId }, 'loginAttempts', 1);
    const user = await this.users.findOne({ where: { id: userId } });
    return user?.loginAttempts ?? 0;
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    await this.users.update(userId, {
      loginAttempts: 0,
      lockedUntil: null,
    });
  }

  async lockUntil(userId: string, until: Date): Promise<void> {
    await this.users.update(userId, { lockedUntil: until });
  }

  async updateName(userId: string, name: string): Promise<PublicUserRecord | null> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }

    user.name = name.trim();
    const saved = await this.users.save(user);
    return this.toPublicUser(saved);
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.users.update(userId, { passwordHash });
  }

  private toAuthUser(
    user: UserEntity,
    tenantStatus: string | null,
  ): AuthUserRecord {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      isSuperadmin: user.isSuperadmin,
      role: user.role,
      tenantId: user.tenantId,
      status: user.status,
      loginAttempts: user.loginAttempts,
      lockedUntil: user.lockedUntil,
      tenantStatus,
    };
  }

  private toPublicUser(user: UserEntity): PublicUserRecord {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperadmin: user.isSuperadmin,
      role: user.role,
      tenantId: user.tenantId,
    };
  }
}
