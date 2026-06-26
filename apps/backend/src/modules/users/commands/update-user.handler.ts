import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PublicUserRecord } from '../../../shared/domain/user.types';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../../shared/domain/user.repository.port';
import { AuditLogRecorderService } from '../services/audit-log-recorder.service';
import { UpdateUserProfileCommand } from './update-user.command';

@CommandHandler(UpdateUserProfileCommand)
export class UpdateUserProfileHandler
  implements ICommandHandler<UpdateUserProfileCommand, PublicUserRecord>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    private readonly auditLogs: AuditLogRecorderService,
  ) {}

  async execute(command: UpdateUserProfileCommand): Promise<PublicUserRecord> {
    const updated = await this.users.updateName(command.userId, command.name);

    if (!updated) {
      throw new NotFoundException({
        error: 'User not found',
        code: 'NOT_FOUND',
      });
    }

    await this.auditLogs.record({
      tenantId: command.tenantId,
      userId: command.userId,
      action: 'user.profile_updated',
      resourceType: 'user',
      resourceId: command.userId,
      details: { name: updated.name },
      ipAddress: command.ipAddress,
    });

    return updated;
  }
}
