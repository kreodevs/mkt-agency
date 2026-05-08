import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrialsController } from './trials.controller';
import { TrialsService } from './trials.service';
import { Trial } from './entities/trial.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trial])],
  controllers: [TrialsController],
  providers: [TrialsService],
  exports: [TrialsService],
})
export class TrialsModule {}