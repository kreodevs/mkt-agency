import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmProviderService } from '../../../shared/ai/llm-provider.service';
import { ContentEntity } from '../../content/infrastructure/typeorm/content.entity';
import {
  SETTINGS_KEY_OPERATING_PROFILE,
  DEFAULT_OPERATING_PROFILE,
  type TenantOperatingProfile,
} from '../../agency-agents/domain/operating-profile.types';
import { TenantEntity } from '../infrastructure/typeorm/tenant.entity';

export interface TenantHealthIssue {
  code: 'pending_approvals' | 'llm_unavailable' | 'inactive_tenant';
  severity: 'warning' | 'critical';
  message: string;
}

export interface TenantHealthSnapshot {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  status: string;
  operatingProfile: TenantOperatingProfile['profile'];
  pendingApprovals: number;
  readyToPublish: number;
  issues: TenantHealthIssue[];
}

export interface TenantHealthOverview {
  llmAvailable: boolean;
  generatedAt: string;
  tenants: TenantHealthSnapshot[];
}

@Injectable()
export class TenantHealthService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(ContentEntity)
    private readonly contents: Repository<ContentEntity>,
    private readonly llmProviders: LlmProviderService,
  ) {}

  async getOverview(): Promise<TenantHealthOverview> {
    const llmAvailable = await this.llmProviders.hasActiveConfigured();

    const [tenantRows, pendingRows, readyRows] = await Promise.all([
      this.tenants.find({ order: { name: 'ASC' } }),
      this.contents
        .createQueryBuilder('c')
        .select('c.tenant_id', 'tenantId')
        .addSelect('COUNT(*)::int', 'count')
        .where(`c.status IN ('draft', 'in_review', 'in_changes')`)
        .andWhere('c.published_at IS NULL')
        .groupBy('c.tenant_id')
        .getRawMany<{ tenantId: string; count: string }>(),
      this.contents
        .createQueryBuilder('c')
        .select('c.tenant_id', 'tenantId')
        .addSelect('COUNT(*)::int', 'count')
        .where(`c.status = 'approved'`)
        .andWhere('c.published_at IS NULL')
        .groupBy('c.tenant_id')
        .getRawMany<{ tenantId: string; count: string }>(),
    ]);

    const pendingByTenant = new Map(pendingRows.map((row) => [row.tenantId, Number(row.count)]));
    const readyByTenant = new Map(readyRows.map((row) => [row.tenantId, Number(row.count)]));

    const tenants: TenantHealthSnapshot[] = tenantRows.map((tenant) => {
      const operatingProfile = this.parseOperatingProfile(tenant.settings);
      const pendingApprovals = pendingByTenant.get(tenant.id) ?? 0;
      const readyToPublish = readyByTenant.get(tenant.id) ?? 0;
      const issues: TenantHealthIssue[] = [];

      if (tenant.status !== 'active') {
        issues.push({
          code: 'inactive_tenant',
          severity: 'warning',
          message: `Tenant en estado ${tenant.status}`,
        });
      }

      if (pendingApprovals > 0) {
        issues.push({
          code: 'pending_approvals',
          severity: pendingApprovals >= 5 ? 'critical' : 'warning',
          message: `${pendingApprovals} pieza(s) esperan aprobación del dueño`,
        });
      }

      if (!llmAvailable) {
        issues.push({
          code: 'llm_unavailable',
          severity: 'critical',
          message: 'Sin proveedor LLM activo en plataforma',
        });
      }

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        status: tenant.status,
        operatingProfile: operatingProfile.profile,
        pendingApprovals,
        readyToPublish,
        issues,
      };
    });

    return {
      llmAvailable,
      generatedAt: new Date().toISOString(),
      tenants,
    };
  }

  private parseOperatingProfile(settings: Record<string, unknown>): TenantOperatingProfile {
    const raw = settings[SETTINGS_KEY_OPERATING_PROFILE];
    if (!raw || typeof raw !== 'object') {
      return DEFAULT_OPERATING_PROFILE;
    }
    const profile = raw as Partial<TenantOperatingProfile>;
    return {
      ...DEFAULT_OPERATING_PROFILE,
      ...profile,
      adBudget: {
        ...DEFAULT_OPERATING_PROFILE.adBudget,
        ...(profile.adBudget ?? {}),
      },
    };
  }
}
