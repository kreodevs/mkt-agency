import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { SuperadminGuard } from '../../shared/guards/superadmin.guard';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { ImpersonateRequestDto } from './dto/impersonate.request.dto';
import { ListUsersResponseDto } from './dto/list-users.response.dto';
import { UpdateUserBySuperadminDto } from './dto/update-user.request.dto';
import { UpdateLlmTaskConfigDto } from './dto/llm-task-config.dto';
import { SuperadminService } from './superadmin.service';
import { LLM_TASK_TYPES, type LlmTaskType } from '../../shared/ai/llm-task-types';

@Controller('superadmin')
@UseGuards(JwtAuthGuard)
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Post('impersonate')
  @UseGuards(SuperadminGuard)
  @AuditLog({ action: 'superadmin.impersonate_started', resourceType: 'user' })
  impersonate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ImpersonateRequestDto,
  ) {
    return this.superadminService.impersonate(user, body);
  }

  @Delete('impersonate')
  endImpersonation(@CurrentUser() user: AuthenticatedUser) {
    return this.superadminService.endImpersonation(user);
  }

  @Get('users')
  @UseGuards(SuperadminGuard)
  @AuditLog({ action: 'superadmin.list_users', resourceType: 'user' })
  listUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ): Promise<ListUsersResponseDto> {
    return this.superadminService.listUsers({
      page: page ?? 1,
      limit: limit ?? 50,
      search,
    });
  }

  @Patch('users/:id')
  @UseGuards(SuperadminGuard)
  @AuditLog({ action: 'superadmin.update_user', resourceType: 'user' })
  updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserBySuperadminDto,
  ) {
    return this.superadminService.updateUser(id, body);
  }

  @Get('llm-tasks')
  @UseGuards(SuperadminGuard)
  @AuditLog({ action: 'superadmin.list_llm_tasks', resourceType: 'llm_task_config' })
  listLlmTasks() {
    return this.superadminService.listLlmTasks();
  }

  @Patch('llm-tasks/:taskType')
  @UseGuards(SuperadminGuard)
  @AuditLog({ action: 'superadmin.update_llm_task', resourceType: 'llm_task_config' })
  updateLlmTask(
    @Param('taskType') taskType: string,
    @Body() body: UpdateLlmTaskConfigDto,
  ) {
    if (!LLM_TASK_TYPES.includes(taskType as LlmTaskType)) {
      throw new BadRequestException({
        error: 'Invalid LLM task type',
        code: 'VALIDATION_ERROR',
      });
    }
    return this.superadminService.updateLlmTask(taskType as LlmTaskType, body);
  }
}