import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OnboardingService } from './onboarding.service';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tenants/:tenantId/onboarding')
@UseGuards(AuthGuard('jwt'))
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  create(@Param('tenantId') tenantId: string, @Body('productId') productId?: string) {
    return this.onboardingService.create(tenantId, productId);
  }

  @Get()
  getOnboarding(@Param('tenantId') tenantId: string) {
    return this.onboardingService.findLatest(tenantId);
  }

  @Get('checklist')
  getDefaultChecklist() {
    return this.onboardingService.getDefaultChecklist();
  }

  @Get(':id')
  getOnboardingById(@Param('id') id: string) {
    return this.onboardingService.findOne(id);
  }

  @Patch(':id/tasks/:taskKey')
  updateTask(
    @Param('id') id: string,
    @Param('taskKey') taskKey: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.onboardingService.updateTask(id, taskKey, dto.status as any);
  }
}
