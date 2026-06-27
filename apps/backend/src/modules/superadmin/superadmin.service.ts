import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { JwtTokenService } from '../../shared/auth/jwt-token.service';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
  PublicUserRecord,
} from '../../shared/domain/user.repository.port';
import {
  ImpersonateCommand,
  ImpersonateResult,
} from './commands/impersonate.command';
import { ImpersonateRequestDto } from './dto/impersonate.request.dto';
import { ListUsersResponseDto } from './dto/list-users.response.dto';
import { UpdateUserBySuperadminDto } from './dto/update-user.request.dto';
import {
  CreateLlmProviderDto,
  UpdateLlmProviderDto,
  UpdateLlmTaskConfigDto,
} from './dto/llm-task-config.dto';
import { LlmConfigService } from '../../shared/ai/llm-config.service';
import { LlmModelsCatalogService } from '../../shared/ai/llm-models-catalog.service';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { LlmTaskType } from '../../shared/ai/llm-task-types';
import { ImpersonationLoggerService } from './services/impersonation-logger.service';

@Injectable()
export class SuperadminService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly jwtTokenService: JwtTokenService,
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    private readonly impersonationLogger: ImpersonationLoggerService,
    private readonly llmConfigService: LlmConfigService,
    private readonly llmProviderService: LlmProviderService,
    private readonly llmModelsCatalogService: LlmModelsCatalogService,
  ) {}

  impersonate(
    superadmin: AuthenticatedUser,
    body: ImpersonateRequestDto,
  ): Promise<ImpersonateResult> {
    return this.commandBus.execute<ImpersonateCommand, ImpersonateResult>(
      new ImpersonateCommand(superadmin, body.tenantId, body.userId),
    );
  }

  async endImpersonation(user: AuthenticatedUser): Promise<{
    message: string;
    sessionToken: string;
  }> {
    if (!user.impersonating || !user.superadminId) {
      throw new ForbiddenException({
        error: 'Not currently impersonating',
        code: 'FORBIDDEN',
      });
    }

    const superadmin = await this.users.findPublicById(user.superadminId);
    if (!superadmin?.isSuperadmin) {
      throw new ForbiddenException({
        error: 'Not currently impersonating',
        code: 'FORBIDDEN',
      });
    }

    await this.impersonationLogger.log({
      superadminId: superadmin.id,
      tenantId: user.tenantId!,
      action: 'impersonation_ended',
      metadata: { impersonatedUserId: user.id },
    });

    const { accessToken } = this.jwtTokenService.signAccessToken({
      sub: superadmin.id,
      email: superadmin.email,
      isSuperadmin: true,
      role: superadmin.role,
      tenantId: null,
    });

    return {
      message: 'Impersonation ended. Audit log recorded.',
      sessionToken: accessToken,
    };
  }

  async listUsers(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<ListUsersResponseDto> {
    const result = await this.users.findAll(params);
    return result;
  }

  async updateUser(
    userId: string,
    body: UpdateUserBySuperadminDto,
  ): Promise<{ id: string; email: string; name: string; role: string; status: string; isSuperadmin: boolean; tenantId: string | null }> {
    const user = await this.users.findPublicById(userId);
    if (!user) {
      throw new NotFoundException({
        error: 'User not found',
        code: 'NOT_FOUND',
      });
    }

    const updated = await this.users.updateById(userId, body);
    if (!updated) {
      throw new NotFoundException({
        error: 'User not found after update',
        code: 'NOT_FOUND',
      });
    }

    // Get full record with status from DB
    const result = await this.users.findAll({
      page: 1,
      limit: 1,
    });
    const fullUser = result.items.find((u) => u.id === userId);

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      status: fullUser?.status ?? 'active',
      isSuperadmin: updated.isSuperadmin,
      tenantId: updated.tenantId,
    };
  }

  listLlmTasks() {
    return this.llmConfigService.listAll();
  }

  updateLlmTask(taskType: LlmTaskType, body: UpdateLlmTaskConfigDto) {
    return this.llmConfigService.update(taskType, body);
  }

  listLlmProviders(includeInactive = false) {
    return this.llmProviderService.list(includeInactive);
  }

  createLlmProvider(body: CreateLlmProviderDto) {
    return this.llmProviderService.create(body);
  }

  updateLlmProvider(id: string, body: UpdateLlmProviderDto) {
    return this.llmProviderService.update(id, body).then((result) => {
      this.llmModelsCatalogService.invalidateProvider(id);
      return result;
    });
  }

  deleteLlmProvider(id: string) {
    this.llmModelsCatalogService.invalidateProvider(id);
    return this.llmProviderService.remove(id);
  }

  listLlmProviderModels(providerId: string) {
    return this.llmModelsCatalogService.listForProvider(providerId);
  }

  listTenantUsers(tenantId: string): Promise<PublicUserRecord[]> {
    return this.users.findByTenantId(tenantId);
  }
}