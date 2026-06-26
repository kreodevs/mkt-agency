import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { USER_REPOSITORY } from '../../shared/domain/user.repository.port';
import { UserEntity } from '../../shared/infrastructure/typeorm/user.entity';
import { TypeOrmUserRepository } from '../../shared/infrastructure/typeorm/typeorm-user.repository';
import { CreateTenantHandler } from './commands/create-tenant.handler';
import { DeleteTenantHandler } from './commands/delete-tenant.handler';
import { TENANT_REPOSITORY } from './domain/tenant.repository.port';
import { TenantEntity } from './infrastructure/typeorm/tenant.entity';
import { TypeOrmTenantRepository } from './infrastructure/typeorm/typeorm-tenant.repository';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [
    CqrsModule,
    AuthSharedModule,
    TypeOrmModule.forFeature([TenantEntity, UserEntity]),
  ],
  controllers: [TenantController],
  providers: [
    TenantService,
    CreateTenantHandler,
    DeleteTenantHandler,
    {
      provide: TENANT_REPOSITORY,
      useClass: TypeOrmTenantRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
  ],
})
export class TenantModule {}
