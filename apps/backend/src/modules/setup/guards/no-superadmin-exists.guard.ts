import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../../shared/domain/user.repository.port';
import { SuperadminAlreadyExistsException } from '../exceptions/superadmin-already-exists.exception';

@Injectable()
export class NoSuperadminExistsGuard implements CanActivate {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async canActivate(_context: ExecutionContext): Promise<boolean> {
    const superadminCount = await this.userRepository.countSuperadmins();
    if (superadminCount > 0) {
      throw new SuperadminAlreadyExistsException();
    }

    return true;
  }
}
