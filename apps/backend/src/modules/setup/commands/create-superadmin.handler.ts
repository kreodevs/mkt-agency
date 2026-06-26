import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Password } from '../../../shared/domain/password.value-object';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../../shared/domain/user.repository.port';
import {
  CreateSuperadminCommand,
  CreateSuperadminResult,
} from './create-superadmin.command';
import { SuperadminAlreadyExistsException } from '../exceptions/superadmin-already-exists.exception';

@CommandHandler(CreateSuperadminCommand)
export class CreateSuperadminHandler
  implements ICommandHandler<CreateSuperadminCommand, CreateSuperadminResult>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(
    command: CreateSuperadminCommand,
  ): Promise<CreateSuperadminResult> {
    const superadminCount = await this.userRepository.countSuperadmins();
    if (superadminCount > 0) {
      throw new SuperadminAlreadyExistsException();
    }

    const password = await Password.createFromPlaintext(command.password);

    return this.userRepository.createSuperadmin({
      email: command.email.trim().toLowerCase(),
      name: command.name.trim(),
      passwordHash: password.toHash(),
    });
  }
}
