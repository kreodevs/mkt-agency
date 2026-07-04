import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import {
  BulkApproveDto,
  BulkApproveResponseDto,
  CopilotStatusResponseDto,
  PrepareWeekDto,
  PrepareWeekResponseDto,
  PublicationInboxQueryDto,
  PublicationInboxResponseDto,
  RequestInboxChangesDto,
  RequestInboxChangesResponseDto,
} from './dto/publication-inbox.dto';
import { CommunityManagerService } from '../community-manager/community-manager.service';
import { CopilotOrchestrationService } from './copilot-orchestration.service';
import { CopilotService } from './copilot.service';
import { PublicationInboxService } from './publication-inbox.service';

@Controller('publication-inbox')
@UseGuards(TenantGuard)
export class PublicationInboxController {
  constructor(
    private readonly inboxService: PublicationInboxService,
    private readonly copilotService: CopilotService,
    private readonly copilotOrchestration: CopilotOrchestrationService,
    private readonly communityManager: CommunityManagerService,
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
  prepareWeek(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: PrepareWeekDto,
  ): Promise<PrepareWeekResponseDto> {
    return this.copilotOrchestration.prepareWeek(
      user.tenantId!,
      user.id,
      body.productId,
    );
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
