import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import {
  TENANT_REPOSITORY,
  TenantRepositoryPort,
} from '../tenant/domain/tenant.repository.port';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../shared/domain/user.repository.port';
import { UpdateUserProfileCommand } from './commands/update-user.command';
import { UpdateProfileRequestDto } from './dto/update-profile.request.dto';

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  isSuperadmin: boolean;
  tenantId: string | null;
  tenant?: { id: string; name: string; plan: string; status: string } | null;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(TENANT_REPOSITORY)
    private readonly tenants: TenantRepositoryPort,
    private readonly commandBus: CommandBus,
  ) {}

  async getMe(user: AuthenticatedUser): Promise<UserProfileResponse> {
    const profile = await this.users.findPublicById(user.id);
    if (!profile) {
      throw new NotFoundException({
        error: 'User not found',
        code: 'NOT_FOUND',
      });
    }

    let tenant: UserProfileResponse['tenant'] = null;
    if (profile.tenantId) {
      const tenantRecord = await this.tenants.findById(profile.tenantId);
      if (tenantRecord) {
        tenant = {
          id: tenantRecord.id,
          name: tenantRecord.name,
          plan: tenantRecord.plan,
          status: tenantRecord.status,
        };
      }
    }

    return {
      ...profile,
      tenant,
    };
  }

  updateMe(
    user: AuthenticatedUser,
    body: UpdateProfileRequestDto,
    ipAddress: string | null,
  ): Promise<UserProfileResponse> {
    return this.commandBus
      .execute(
        new UpdateUserProfileCommand(
          user.id,
          body.name,
          ipAddress,
          user.tenantId,
        ),
      )
      .then(async (updated) => this.getMe({ ...user, ...updated }));
  }
}
