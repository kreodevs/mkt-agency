import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USER_REPOSITORY } from '../../shared/domain/user.repository.port';
import { UserEntity } from '../../shared/infrastructure/typeorm/user.entity';
import { TypeOrmUserRepository } from '../../shared/infrastructure/typeorm/typeorm-user.repository';
import { TENANT_REPOSITORY } from '../tenant/domain/tenant.repository.port';
import { TenantEntity } from '../tenant/infrastructure/typeorm/tenant.entity';
import { TypeOrmTenantRepository } from '../tenant/infrastructure/typeorm/typeorm-tenant.repository';
import { UpdateUserProfileHandler } from './commands/update-user.handler';
import { AuditLogEntity } from './infrastructure/typeorm/audit-log.entity';
import { AuditLogRecorderService } from './services/audit-log-recorder.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserEntity, TenantEntity, AuditLogEntity]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UpdateUserProfileHandler,
    AuditLogRecorderService,
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
    {
      provide: TENANT_REPOSITORY,
      useClass: TypeOrmTenantRepository,
    },
  ],
})
export class UsersModule {}
