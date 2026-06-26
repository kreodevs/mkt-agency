import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { QueueModule } from '../../shared/queue/queue.module';
import { AuditLogEntity } from '../users/infrastructure/typeorm/audit-log.entity';
import { AuditLogRecorderService } from '../users/services/audit-log-recorder.service';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { LogRetentionProcessor } from './workers/log-retention.processor';
import { LogRetentionWorkerService } from './workers/log-retention.worker';

@Module({
  imports: [
    AuthSharedModule,
    QueueModule,
    TypeOrmModule.forFeature([AuditLogEntity]),
  ],
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditLogRecorderService,
    LogRetentionWorkerService,
    LogRetentionProcessor,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
  exports: [AuditService, AuditLogRecorderService],
})
export class AuditModule {}
