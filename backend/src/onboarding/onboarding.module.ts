import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { Onboarding } from './entities/onboarding.entity';
import { OnboardingTask } from './entities/onboarding-task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Onboarding, OnboardingTask])],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
