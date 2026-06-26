import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { USER_REPOSITORY } from '../../shared/domain/user.repository.port';
import { UserEntity } from '../../shared/infrastructure/typeorm/user.entity';
import { TypeOrmUserRepository } from '../../shared/infrastructure/typeorm/typeorm-user.repository';
import { SecurityModule } from '../security/security.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginHandler } from './commands/login.handler';
import { RefreshTokenHandler } from './commands/refresh-token.handler';
import { SESSION_REPOSITORY } from './domain/session.repository.port';
import { SessionEntity } from './infrastructure/typeorm/session.entity';
import { TypeOrmSessionRepository } from './infrastructure/typeorm/typeorm-session.repository';

@Module({
  imports: [
    CqrsModule,
    AuthSharedModule,
    SecurityModule,
    TypeOrmModule.forFeature([SessionEntity, UserEntity]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LoginHandler,
    RefreshTokenHandler,
    {
      provide: SESSION_REPOSITORY,
      useClass: TypeOrmSessionRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
