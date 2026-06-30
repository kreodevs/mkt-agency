import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import {
  BulkApproveDto,
  BulkApproveResponseDto,
  PublicationInboxQueryDto,
  PublicationInboxResponseDto,
} from './dto/publication-inbox.dto';
import { PublicationInboxService } from './publication-inbox.service';

@Controller('publication-inbox')
@UseGuards(TenantGuard)
export class PublicationInboxController {
  constructor(private readonly inboxService: PublicationInboxService) {}

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
}
