import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../shared/infrastructure/typeorm/user.entity';
import { AssetEntity } from '../../assets/infrastructure/typeorm/asset.entity';
import { CampaignEntity } from '../../campaign/infrastructure/typeorm/campaign.entity';
import { TenantEntity } from '../../tenant/infrastructure/typeorm/tenant.entity';
import { PackageEntity } from '../infrastructure/typeorm/package.entity';
import { TenantLimitsSnapshot } from '../domain/tenant-limits.types';

@Injectable()
export class TenantLimitsService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(PackageEntity)
    private readonly packages: Repository<PackageEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(AssetEntity)
    private readonly assets: Repository<AssetEntity>,
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
  ) {}

  async getSnapshot(tenantId: string): Promise<TenantLimitsSnapshot> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException({
        error: 'Tenant not found',
        code: 'NOT_FOUND',
      });
    }

    const pkg = tenant.packageId
      ? await this.packages.findOne({ where: { id: tenant.packageId } })
      : null;

    const [users, assetsBytes, campaigns] = await Promise.all([
      this.users.count({ where: { tenantId, status: 'active' } }),
      this.sumAssetBytes(tenantId),
      this.campaigns.count({ where: { tenantId } }),
    ]);

    return {
      tenantId: tenant.id,
      packageId: tenant.packageId,
      packageName: pkg?.name ?? null,
      packageSlug: pkg?.slug ?? tenant.plan,
      maxUsers: tenant.maxUsers,
      maxAssetsSize: Number(tenant.maxAssetsSize),
      maxFileSize: Number(tenant.maxFileSize),
      maxCampaigns: pkg?.maxCampaigns ?? null,
      maxAiRequestsPerDay: pkg?.maxAiRequestsPerDay ?? null,
      features: pkg?.features ?? {},
      usage: {
        users,
        assetsBytes,
        campaigns,
      },
    };
  }

  async assertCanUpload(tenantId: string, fileSize: number): Promise<void> {
    const snapshot = await this.getSnapshot(tenantId);

    if (fileSize > snapshot.maxFileSize) {
      throw new PayloadTooLargeException({
        error: 'File size exceeds plan limit',
        code: 'PAYLOAD_TOO_LARGE',
        maxSize: snapshot.maxFileSize,
      });
    }

    if (snapshot.usage.assetsBytes + fileSize > snapshot.maxAssetsSize) {
      throw new PayloadTooLargeException({
        error: 'Storage quota exceeded for tenant plan',
        code: 'STORAGE_QUOTA_EXCEEDED',
        maxAssetsSize: snapshot.maxAssetsSize,
        usedBytes: snapshot.usage.assetsBytes,
      });
    }
  }

  async assertCanAddUser(tenantId: string): Promise<void> {
    const snapshot = await this.getSnapshot(tenantId);
    if (snapshot.usage.users >= snapshot.maxUsers) {
      throw new ForbiddenException({
        error: 'User limit reached for tenant plan',
        code: 'USER_LIMIT_REACHED',
        maxUsers: snapshot.maxUsers,
      });
    }
  }

  async applyPackageLimits(
    tenantId: string,
    packageId: string,
  ): Promise<void> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    const pkg = await this.packages.findOne({ where: { id: packageId } });
    if (!tenant || !pkg) {
      throw new NotFoundException({
        error: 'Tenant or package not found',
        code: 'NOT_FOUND',
      });
    }

    tenant.packageId = pkg.id;
    tenant.plan = pkg.slug;
    tenant.maxUsers = pkg.maxUsers;
    tenant.maxAssetsSize = pkg.maxAssetsSize;
    tenant.maxFileSize = pkg.maxFileSize;
    await this.tenants.save(tenant);
  }

  private async sumAssetBytes(tenantId: string): Promise<number> {
    const result = await this.assets
      .createQueryBuilder('a')
      .select('COALESCE(SUM(a.file_size::bigint), 0)', 'total')
      .where('a.tenant_id = :tenantId', { tenantId })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }
}
