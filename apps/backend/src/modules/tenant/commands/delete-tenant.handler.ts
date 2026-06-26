import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  TENANT_REPOSITORY,
  TenantRepositoryPort,
} from '../domain/tenant.repository.port';
import { DeleteTenantCommand } from './delete-tenant.command';
import { TenantNotFoundException } from '../exceptions/tenant-not-found.exception';

@CommandHandler(DeleteTenantCommand)
export class DeleteTenantHandler
  implements ICommandHandler<DeleteTenantCommand, void>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepositoryPort,
  ) {}

  async execute(command: DeleteTenantCommand): Promise<void> {
    const tenant = await this.tenantRepository.findById(command.tenantId);
    if (!tenant) {
      throw new TenantNotFoundException();
    }

    // Regla superadmin mínimo (MDD §5.1.6) aplica a DeleteUserCommand, no a tenants.
    // La eliminación en cascada solo afecta usuarios del tenant (is_superadmin=false).
    await this.tenantRepository.delete(command.tenantId);
  }
}
