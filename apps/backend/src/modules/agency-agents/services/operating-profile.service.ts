import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackageEntity } from '../../packages/infrastructure/typeorm/package.entity';
import {
  AGENT_ACTIVATION_BY_SUBPROFILE,
  isAgentActive,
} from '../domain/agent-activation.constants';
import { AgentRole } from '../domain/agent-role.enum';
import {
  DEFAULT_OPERATING_PROFILE,
  SETTINGS_KEY_OPERATING_PROFILE,
  type AdBudgetConfig,
  type AgentActivationMatrix,
  type OperatingSubProfile,
  type TenantOperatingProfile,
  type TenantProfile,
  type UpdateOperatingProfileInput,
} from '../domain/operating-profile.types';
import { TenantEntity } from '../../tenant/infrastructure/typeorm/tenant.entity';

export interface PackageAgencyFeatures {
  profile?: TenantProfile;
  adBudgetAllowed?: boolean;
  maxOrganicCampaigns?: number;
  maxPaidCampaigns?: number;
}

@Injectable()
export class OperatingProfileService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(PackageEntity)
    private readonly packages: Repository<PackageEntity>,
  ) {}

  resolveSubProfile(profile: TenantOperatingProfile): OperatingSubProfile {
    if (profile.profile === 'soho') {
      return 'soho';
    }
    if (profile.adBudget.enabled && (profile.adBudget.monthlyCap ?? 0) > 0) {
      return 'growth_paid';
    }
    return 'growth_organic';
  }

  getActivationMatrix(profile: TenantOperatingProfile): AgentActivationMatrix {
    return AGENT_ACTIVATION_BY_SUBPROFILE[this.resolveSubProfile(profile)];
  }

  canActivateAgent(profile: TenantOperatingProfile, role: AgentRole): boolean {
    const matrix = this.getActivationMatrix(profile);
    return isAgentActive(matrix, role);
  }

  isGrowthProfile(profile: TenantOperatingProfile): boolean {
    return profile.profile === 'growth';
  }

  isPaidCapable(profile: TenantOperatingProfile): boolean {
    return this.resolveSubProfile(profile) === 'growth_paid';
  }

  async getProfile(tenantId: string): Promise<TenantOperatingProfile> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException({ error: 'Tenant not found', code: 'NOT_FOUND' });
    }
    return this.parseProfile(tenant.settings ?? {});
  }

  async updateProfile(
    tenantId: string,
    patch: UpdateOperatingProfileInput,
  ): Promise<TenantOperatingProfile> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException({ error: 'Tenant not found', code: 'NOT_FOUND' });
    }

    const current = this.parseProfile(tenant.settings ?? {});
    const pkgFeatures = await this.loadPackageFeatures(tenant.packageId);
    const merged = this.mergeProfile(current, patch, pkgFeatures);

    this.validateProfile(merged, pkgFeatures);

    const settings = {
      ...(tenant.settings ?? {}),
      [SETTINGS_KEY_OPERATING_PROFILE]: merged,
    };

    await this.tenants.update(tenantId, { settings });
    return merged;
  }

  parseProfile(settings: Record<string, unknown>): TenantOperatingProfile {
    const raw = settings[SETTINGS_KEY_OPERATING_PROFILE];
    if (!raw || typeof raw !== 'object') {
      return { ...DEFAULT_OPERATING_PROFILE };
    }
    const obj = raw as Record<string, unknown>;
    const adBudgetRaw = (obj.adBudget as Record<string, unknown>) ?? {};

    return {
      profile: obj.profile === 'growth' ? 'growth' : 'soho',
      campaignExecutionMode: obj.campaignExecutionMode === 'paid' ? 'paid' : 'organic',
      adBudget: {
        enabled: Boolean(adBudgetRaw.enabled),
        monthlyCap:
          typeof adBudgetRaw.monthlyCap === 'number' ? adBudgetRaw.monthlyCap : null,
        currency: typeof adBudgetRaw.currency === 'string' ? adBudgetRaw.currency : 'MXN',
        platforms: Array.isArray(adBudgetRaw.platforms)
          ? (adBudgetRaw.platforms as AdBudgetConfig['platforms'])
          : [],
      },
    };
  }

  defaultProfileFromPackage(features: PackageAgencyFeatures): TenantOperatingProfile {
    const profile = features.profile ?? 'soho';
    const adBudgetAllowed = features.adBudgetAllowed ?? false;

    return {
      profile,
      campaignExecutionMode: 'organic',
      adBudget: {
        enabled: false,
        monthlyCap: null,
        currency: 'MXN',
        platforms: adBudgetAllowed ? ['meta'] : [],
      },
    };
  }

  private mergeProfile(
    current: TenantOperatingProfile,
    patch: UpdateOperatingProfileInput,
    pkgFeatures: PackageAgencyFeatures,
  ): TenantOperatingProfile {
    const profile = patch.profile ?? current.profile;
    const adBudgetPatch = patch.adBudget ?? {};

    let adBudget: AdBudgetConfig = {
      ...current.adBudget,
      ...adBudgetPatch,
    };

    if (profile === 'soho') {
      adBudget = {
        ...adBudget,
        enabled: false,
        monthlyCap: null,
        platforms: [],
      };
    }

    if (!pkgFeatures.adBudgetAllowed) {
      adBudget = { ...adBudget, enabled: false, monthlyCap: null };
    }

    const campaignExecutionMode =
      patch.campaignExecutionMode ??
      (adBudget.enabled && (adBudget.monthlyCap ?? 0) > 0 ? 'paid' : current.campaignExecutionMode);

    return {
      profile,
      campaignExecutionMode:
        profile === 'soho'
          ? 'organic'
          : campaignExecutionMode === 'paid' && adBudget.enabled
            ? 'paid'
            : 'organic',
      adBudget,
    };
  }

  private validateProfile(
    profile: TenantOperatingProfile,
    pkgFeatures: PackageAgencyFeatures,
  ): void {
    if (profile.adBudget.enabled && !pkgFeatures.adBudgetAllowed) {
      throw new ForbiddenException({
        error: 'Tu plan no incluye presupuesto de publicidad pagada',
        code: 'AD_BUDGET_NOT_ALLOWED',
      });
    }

    if (profile.adBudget.enabled && (profile.adBudget.monthlyCap ?? 0) <= 0) {
      throw new BadRequestException({
        error: 'Indica un presupuesto mensual mayor a cero para activar pauta',
        code: 'VALIDATION_ERROR',
      });
    }

    if (profile.profile === 'growth' && profile.adBudget.enabled && profile.adBudget.platforms.length === 0) {
      throw new BadRequestException({
        error: 'Selecciona al menos una plataforma de publicidad',
        code: 'VALIDATION_ERROR',
      });
    }
  }

  private async loadPackageFeatures(packageId: string | null): Promise<PackageAgencyFeatures> {
    if (!packageId) {
      return { adBudgetAllowed: false };
    }
    const pkg = await this.packages.findOne({ where: { id: packageId } });
    if (!pkg?.features) {
      return { adBudgetAllowed: false };
    }
    const features = pkg.features as PackageAgencyFeatures;
    return {
      profile: features.profile,
      adBudgetAllowed: features.adBudgetAllowed ?? false,
      maxOrganicCampaigns: features.maxOrganicCampaigns,
      maxPaidCampaigns: features.maxPaidCampaigns,
    };
  }
}
