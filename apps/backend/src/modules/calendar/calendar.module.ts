import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
  imports: [AuthSharedModule, TypeOrmModule.forFeature([ContentEntity])],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
