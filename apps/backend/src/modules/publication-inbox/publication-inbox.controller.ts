import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import {
  BulkApproveDto,
  BulkApproveResponseDto,
  CopilotStatusResponseDto,
  PrepareWeekDto,
  PrepareWeekJobStartedDto,
  PrepareWeekJobStatusDto,
  PublicationInboxQueryDto,
  PublicationInboxResponseDto,
  RequestInboxChangesDto,
  RequestInboxChangesResponseDto,
} from './dto/publication-inbox.dto';
import { CommunityManagerService } from '../community-manager/community-manager.service';
import { CopilotService } from './copilot.service';
import { PublicationInboxService } from './publication-inbox.service';
import { CopilotPrepareWeekWorkerService } from './workers/copilot-prepare-week.worker';

@Controller('publication-inbox')
@UseGuards(TenantGuard)
export class PublicationInboxController {
  constructor(
    private readonly inboxService: PublicationInboxService,
    private readonly copilotService: CopilotService,
    private readonly communityManager: CommunityManagerService,
    private readonly prepareWeekWorker: CopilotPrepareWeekWorkerService,
  ) {}

  @Get()
  getInbox(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PublicationInboxQueryDto,
  ): Promise<PublicationInboxResponseDto> {
    return this.inboxService.getInbox(user.tenantId!, query.productId);
  }

  @Post('bulk-approve')
  bulkApprove(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: BulkApproveDto,
  ): Promise<BulkApproveResponseDto> {
    return this.inboxService.bulkApprove(user.tenantId!, user.id, body.contentIds);
  }

  @Patch('notifications/:id/read')
  async markNotificationRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ ok: true }> {
    await this.inboxService.markNotificationRead(user.tenantId!, id);
    return { ok: true };
  }

  @Patch('notifications/read-all')
  async markAllRead(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ marked: number }> {
    const marked = await this.inboxService.markAllNotificationsRead(user.tenantId!);
    return { marked };
  }

  @Get('copilot-status')
  getCopilotStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PublicationInboxQueryDto,
  ): Promise<CopilotStatusResponseDto> {
    return this.copilotService.getStatus(user.tenantId!, query.productId);
  }

  @Post('prepare-week')
  @HttpCode(HttpStatus.ACCEPTED)
  async prepareWeek(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: PrepareWeekDto,
  ): Promise<PrepareWeekJobStartedDto> {
    const jobId = await this.prepareWeekWorker.enqueue(
      user.tenantId!,
      user.id,
      body.productId,
    );
    return { jobId, status: 'processing' };
  }

  @Get('prepare-week/jobs/:jobId')
  getPrepareWeekJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId') jobId: string,
  ): Promise<PrepareWeekJobStatusDto> {
    return this.prepareWeekWorker.getStatus(jobId, user.tenantId!);
  }

  @Post('regenerate/:contentId')
  regenerateContent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
  ) {
    return this.communityManager.regeneratePostForContent(
      user.tenantId!,
      user.id,
      contentId,
    );
  }

  @Post('request-changes/:contentId')
  requestChanges(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
    @Body() body: RequestInboxChangesDto,
  ): Promise<RequestInboxChangesResponseDto> {
    return this.communityManager.regeneratePostForContent(
      user.tenantId!,
      user.id,
      contentId,
      { feedback: body.feedback, versionId: body.versionId },
    );
  }
}
