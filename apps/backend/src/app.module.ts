import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { SessionEntity } from './modules/auth/infrastructure/typeorm/session.entity';
import { SecurityModule } from './modules/security/security.module';
import { SecurityEventEntity } from './modules/security/infrastructure/typeorm/security-event.entity';
import { SetupModule } from './modules/setup/setup.module';
import { SuperadminModule } from './modules/superadmin/superadmin.module';
import { ImpersonationLogEntity } from './modules/superadmin/infrastructure/typeorm/impersonation-log.entity';
import { TenantModule } from './modules/tenant/tenant.module';
import { CompanyProfileModule } from './modules/company-profile/company-profile.module';
import { CompanyProfileEntity } from './modules/company-profile/infrastructure/typeorm/company-profile.entity';
import { CompanyProfileSectionEntity } from './modules/company-profile/infrastructure/typeorm/company-profile-section.entity';
import { OutboxEntity } from './modules/company-profile/infrastructure/typeorm/outbox.entity';
import { UsersModule } from './modules/users/users.module';
import { AuditLogEntity } from './modules/users/infrastructure/typeorm/audit-log.entity';
import { TenantEntity } from './modules/tenant/infrastructure/typeorm/tenant.entity';
import { AuthSharedModule } from './shared/auth/auth-shared.module';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { UserEntity } from './shared/infrastructure/typeorm/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USER', 'mktos'),
        password: config.get<string>('DB_PASSWORD', 'change_me'),
        database: config.get<string>('DB_NAME', 'mktos'),
        entities: [
          UserEntity,
          TenantEntity,
          SessionEntity,
          SecurityEventEntity,
          ImpersonationLogEntity,
          AuditLogEntity,
          CompanyProfileEntity,
          CompanyProfileSectionEntity,
          OutboxEntity,
        ],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    AuthSharedModule,
    AuthModule,
    SetupModule,
    TenantModule,
    CompanyProfileModule,
    SuperadminModule,
    UsersModule,
    SecurityModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
