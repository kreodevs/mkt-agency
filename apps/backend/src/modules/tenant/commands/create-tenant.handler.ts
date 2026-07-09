import {
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { rethrowKnownDatabaseError } from '../../../shared/database/postgres-errors';
import { Password } from '../../../shared/domain/password.value-object';
import { UserEntity } from '../../../shared/infrastructure/typeorm/user.entity';
import { PackageService } from '../../packages/package.service';
import {
  DEFAULT_OPERATING_PROFILE,
  SETTINGS_KEY_OPERATING_PROFILE,
  type TenantOperatingProfile,
} from '../../agency-agents/domain/operating-profile.types';
import type { PackageAgencyFeatures } from '../../agency-agents/services/operating-profile.service';
import { ALL_SECTION_KEYS } from '../../company-profile/domain/section-keys';
import { CompanyProfileEntity } from '../../company-profile/infrastructure/typeorm/company-profile.entity';
import { CompanyProfileSectionEntity } from '../../company-profile/infrastructure/typeorm/company-profile-section.entity';
import {
  TENANT_REPOSITORY,
  TenantRepositoryPort,
} from '../domain/tenant.repository.port';
import { TenantEntity } from '../infrastructure/typeorm/tenant.entity';
import {
  CreateTenantCommand,
  CreateTenantResult,
} from './create-tenant.command';
import { SlugAlreadyExistsException } from '../exceptions/slug-already-exists.exception';

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler
  implements ICommandHandler<CreateTenantCommand, CreateTenantResult>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepositoryPort,
    private readonly dataSource: DataSource,
    private readonly packageService: PackageService,
  ) {}

  async execute(command: CreateTenantCommand): Promise<CreateTenantResult> {
    const existing = await this.tenantRepository.findBySlug(command.slug);
    if (existing) {
      throw new SlugAlreadyExistsException();
    }

    const pkg = await this.packageService.findEntityById(command.packageId);
    if (!pkg || !pkg.isActive) {
      throw new BadRequestException({
        error: 'Invalid or inactive package',
        code: 'VALIDATION_ERROR',
      });
    }

    const password = await Password.createFromPlaintext(command.ownerPassword);
    const ownerEmail = command.ownerEmail.trim().toLowerCase();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tenantRepo = queryRunner.manager.getRepository(TenantEntity);
      const userRepo = queryRunner.manager.getRepository(UserEntity);

      const packageFeatures = (pkg.features ?? {}) as PackageAgencyFeatures;
      const operatingProfile = buildDefaultOperatingProfile(packageFeatures);

      const tenantEntity = tenantRepo.create({
        name: command.name.trim(),
        slug: command.slug.trim().toLowerCase(),
        plan: pkg.slug,
        packageId: pkg.id,
        status: 'active',
        settings: {
          [SETTINGS_KEY_OPERATING_PROFILE]: operatingProfile,
        },
        maxUsers: pkg.maxUsers,
        maxAssetsSize: pkg.maxAssetsSize,
        maxFileSize: pkg.maxFileSize,
      });
      const savedTenant = await tenantRepo.save(tenantEntity);

      const ownerEntity = userRepo.create({
        email: ownerEmail,
        name: command.ownerName.trim(),
        passwordHash: password.toHash(),
        isSuperadmin: false,
        tenantId: savedTenant.id,
        role: 'owner',
        status: 'active',
      });
      const savedOwner = await userRepo.save(ownerEntity);

      const profileRepo = queryRunner.manager.getRepository(CompanyProfileEntity);
      const sectionRepo = queryRunner.manager.getRepository(
        CompanyProfileSectionEntity,
      );
      const profile = await profileRepo.save(
        profileRepo.create({ tenantId: savedTenant.id, status: 'pending' }),
      );

      for (const sectionKey of ALL_SECTION_KEYS) {
        await sectionRepo.save(
          sectionRepo.create({
            profileId: profile.id,
            sectionKey,
            data: {},
            isCompleted: false,
          }),
        );
      }

      await queryRunner.commitTransaction();

      return {
        id: savedTenant.id,
        name: savedTenant.name,
        slug: savedTenant.slug,
        plan: savedTenant.plan,
        packageId: savedTenant.packageId,
        status: savedTenant.status,
        settings: savedTenant.settings,
        maxUsers: savedTenant.maxUsers,
        maxAssetsSize: Number(savedTenant.maxAssetsSize),
        maxFileSize: Number(savedTenant.maxFileSize),
        createdAt: savedTenant.createdAt,
        updatedAt: savedTenant.updatedAt,
        owner: {
          id: savedOwner.id,
          email: savedOwner.email,
          name: savedOwner.name,
          role: savedOwner.role,
          tenantId: savedOwner.tenantId!,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      rethrowKnownDatabaseError(error);
    } finally {
      await queryRunner.release();
    }
  }
}

function buildDefaultOperatingProfile(features: PackageAgencyFeatures): TenantOperatingProfile {
  const profile = features.profile ?? 'soho';
  const adBudgetAllowed = features.adBudgetAllowed ?? false;

  if (profile === 'growth') {
    return {
      profile: 'growth',
      campaignExecutionMode: 'organic',
      adBudget: {
        enabled: false,
        monthlyCap: null,
        currency: 'MXN',
        platforms: adBudgetAllowed ? ['meta'] : [],
      },
    };
  }

  return { ...DEFAULT_OPERATING_PROFILE };
}
