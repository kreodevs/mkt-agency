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
  ListUsersParams,
  ListUsersResult,
  UserWithTenant,
  UpdateUserByRepo,
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
      where: { id, tenantId },
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

  async clearTenantId(userId: string): Promise<void> {
    await this.users.update(userId, { tenantId: null });
  }

  async findByTenantId(tenantId: string): Promise<PublicUserRecord[]> {
    const users = await this.users.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
    return users.map((u) => this.toPublicUser(u));
  }

  async findTenantProxyUser(tenantId: string): Promise<PublicUserRecord | null> {
    const user = await this.users
      .createQueryBuilder('user')
      .where('user.tenant_id = :tenantId', { tenantId })
      .andWhere('user.is_superadmin = false')
      .andWhere('user.status = :status', { status: 'active' })
      .orderBy(
        `CASE user.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END`,
        'ASC',
      )
      .addOrderBy('user.created_at', 'ASC')
      .getOne();

    return user ? this.toPublicUser(user) : null;
  }

  async findAll(params: ListUsersParams): Promise<ListUsersResult> {
    const { page, limit, search } = params;
    const query = this.users.createQueryBuilder('user');

    if (search) {
      query.where(
        '(LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.name) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    const total = await query.getCount();
    const items = await query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const tenantsMap = new Map<string, { id: string; name: string; slug: string; plan: string; status: string }>();
    const tenantIds = items.filter((u) => u.tenantId).map((u) => u.tenantId!);
    if (tenantIds.length > 0) {
      const tenants = await this.dataSource
        .getRepository(TenantEntity)
        .find({ where: tenantIds.map((id) => ({ id })) });
      for (const t of tenants) {
        tenantsMap.set(t.id, {
          id: t.id,
          name: t.name,
          slug: t.slug,
          plan: t.plan,
          status: t.status,
        });
      }
    }

    const mapped: UserWithTenant[] = items.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperadmin: user.isSuperadmin,
      role: user.role,
      tenantId: user.tenantId,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      tenant: user.tenantId ? (tenantsMap.get(user.tenantId) ?? null) : null,
    }));

    return { items: mapped, total, page, limit };
  }

  async updateById(userId: string, data: UpdateUserByRepo): Promise<UserWithTenant | null> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.tenantId !== undefined) updateData.tenantId = data.tenantId;

    if (Object.keys(updateData).length === 0) {
      return this.findWithTenantById(userId);
    }

    await this.users.update(userId, updateData);
    return this.findWithTenantById(userId);
  }

  private async findWithTenantById(userId: string): Promise<UserWithTenant | null> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) return null;

    let tenant: UserWithTenant['tenant'] = null;
    if (user.tenantId) {
      const t = await this.dataSource
        .getRepository(TenantEntity)
        .findOne({ where: { id: user.tenantId } });
      if (t) {
        tenant = { id: t.id, name: t.name, slug: t.slug, plan: t.plan, status: t.status };
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperadmin: user.isSuperadmin,
      role: user.role,
      tenantId: user.tenantId,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      tenant,
    };
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
