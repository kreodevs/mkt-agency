import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { USER_REPOSITORY } from '../../shared/domain/user.repository.port';
import { UserEntity } from '../../shared/infrastructure/typeorm/user.entity';
import { TypeOrmUserRepository } from '../../shared/infrastructure/typeorm/typeorm-user.repository';
import { TENANT_REPOSITORY } from '../tenant/domain/tenant.repository.port';
import { TenantEntity } from '../tenant/infrastructure/typeorm/tenant.entity';
import { TypeOrmTenantRepository } from '../tenant/infrastructure/typeorm/typeorm-tenant.repository';
import { ImpersonateHandler } from './commands/impersonate.handler';
import { ImpersonationLogEntity } from './infrastructure/typeorm/impersonation-log.entity';
import { ImpersonationLoggerService } from './services/impersonation-logger.service';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';

@Module({
  imports: [
    CqrsModule,
    AuthSharedModule,
    TypeOrmModule.forFeature([
      ImpersonationLogEntity,
      TenantEntity,
      UserEntity,
    ]),
  ],
  controllers: [SuperadminController],
  providers: [
    SuperadminService,
    ImpersonateHandler,
    ImpersonationLoggerService,
    {
      provide: TENANT_REPOSITORY,
      useClass: TypeOrmTenantRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: [ImpersonationLoggerService],
})
export class SuperadminModule {}
