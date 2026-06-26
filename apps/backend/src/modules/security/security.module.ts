import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { SecurityEventEntity } from './infrastructure/typeorm/security-event.entity';
import { SecurityController } from './security.controller';
import { SecurityEventsService } from './security-events.service';
import { SecurityEventRecorderService } from './services/security-event-recorder.service';

@Module({
  imports: [
    AuthSharedModule,
    TypeOrmModule.forFeature([SecurityEventEntity]),
  ],
  controllers: [SecurityController],
  providers: [SecurityEventRecorderService, SecurityEventsService],
  exports: [SecurityEventRecorderService],
})
export class SecurityModule {}
