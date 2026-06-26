import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USER_REPOSITORY } from '../../shared/domain/user.repository.port';
import { UserEntity } from '../../shared/infrastructure/typeorm/user.entity';
import { TypeOrmUserRepository } from '../../shared/infrastructure/typeorm/typeorm-user.repository';
import { CreateSuperadminHandler } from './commands/create-superadmin.handler';
import { NoSuperadminExistsGuard } from './guards/no-superadmin-exists.guard';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([UserEntity])],
  controllers: [SetupController],
  providers: [
    SetupService,
    CreateSuperadminHandler,
    NoSuperadminExistsGuard,
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
  ],
})
export class SetupModule {}
