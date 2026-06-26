import { Inject, Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../shared/domain/user.repository.port';
import {
  CreateSuperadminCommand,
  CreateSuperadminResult,
} from './commands/create-superadmin.command';
import { SetupInitRequestDto } from './dto/setup-init.request.dto';
import { SetupInitResponseDto } from './dto/setup-init.response.dto';
import { SetupStatusResponseDto } from './dto/setup-status.response.dto';

@Injectable()
export class SetupService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    private readonly commandBus: CommandBus,
  ) {}

  async getStatus(): Promise<SetupStatusResponseDto> {
    const superadminCount = await this.userRepository.countSuperadmins();
    const isConfigured = superadminCount > 0;

    return {
      isConfigured,
      message: isConfigured
        ? 'System ready. Redirect to /auth/login.'
        : 'No superadmin configured. Use /setup/init to bootstrap.',
    };
  }

  init(body: SetupInitRequestDto): Promise<SetupInitResponseDto> {
    return this.commandBus.execute<
      CreateSuperadminCommand,
      CreateSuperadminResult
    >(
      new CreateSuperadminCommand(body.email, body.password, body.name),
    );
  }
}
