import { Inject, Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { TenantLimitsService } from '../packages/services/tenant-limits.service';
import {
  CreateTenantCommand,
  CreateTenantResult,
} from './commands/create-tenant.command';
import { DeleteTenantCommand } from './commands/delete-tenant.command';
import { CreateTenantRequestDto } from './dto/create-tenant.request.dto';
import {
  ListTenantsQueryDto,
  UpdateTenantRequestDto,
} from './dto/tenant.request.dto';
import {
  PaginatedTenantsResponseDto,
  TenantResponseDto,
  toCreateTenantResponse,
  toTenantResponse,
} from './dto/tenant.response.dto';
import {
  TENANT_REPOSITORY,
  TenantRepositoryPort,
} from './domain/tenant.repository.port';
import { TenantNotFoundException } from './exceptions/tenant-not-found.exception';
import { TenantPlatformAdminService } from './services/tenant-platform-admin.service';

@Injectable()
export class TenantService {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepositoryPort,
    private readonly commandBus: CommandBus,
    private readonly tenantLimitsService: TenantLimitsService,
    private readonly tenantPlatformAdmins: TenantPlatformAdminService,
  ) {}

  async create(body: CreateTenantRequestDto): Promise<TenantResponseDto> {
    const result = await this.commandBus.execute<
      CreateTenantCommand,
      CreateTenantResult
    >(
      new CreateTenantCommand(
        body.name,
        body.slug,
        body.packageId,
        body.owner.email,
        body.owner.password,
        body.owner.name,
      ),
    );

    return toCreateTenantResponse(result);
  }

  async list(query: ListTenantsQueryDto): Promise<PaginatedTenantsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.tenantRepository.list({
      page,
      limit,
      status: query.status,
      plan: query.plan,
    });

    return {
      items: result.items.map(toTenantResponse),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async findById(id: string): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new TenantNotFoundException();
    }

    const response = toTenantResponse(tenant);
    response.platformAdmins = await this.tenantPlatformAdmins.listForTenant(id);
    return response;
  }

  async update(
    id: string,
    body: UpdateTenantRequestDto,
  ): Promise<TenantResponseDto> {
    const { platformAdminIds, ...tenantPatch } = body;

    if (platformAdminIds !== undefined) {
      await this.tenantPlatformAdmins.replaceForTenant(id, platformAdminIds);
    }

    let patch = { ...tenantPatch };

    if (patch.packageId) {
      await this.tenantLimitsService.applyPackageLimits(id, patch.packageId);
      const { packageId: _packageId, plan: _plan, ...rest } = patch;
      patch = rest;
    }

    if (Object.keys(patch).length === 0) {
      return this.findById(id);
    }

    const tenant = await this.tenantRepository.update(id, patch);
    if (!tenant) {
      throw new TenantNotFoundException();
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.commandBus.execute(new DeleteTenantCommand(id));
  }
}
