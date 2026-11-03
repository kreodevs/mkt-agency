import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import {
  AgencyNotificationDto,
  BulkApproveDto,
  BulkApproveResponseDto,
  BulkDeleteInboxResponseDto,
  CopilotStatusResponseDto,
  DeleteInboxContentResponseDto,
  DismissInboxContentResponseDto,
  PrepareWeekDto,
  PrepareWeekJobStartedDto,
  PrepareWeekJobStatusDto,
  PublicationInboxQueryDto,
  PublicationInboxResponseDto,
  PurgeInboxDto,
  RegenerateInboxContentDto,
  PivotAngleInboxContentDto,
  type InboxPivotAngle,
  BulkDeleteInboxDto,
  RequestInboxChangesDto,
  RequestInboxChangesResponseDto,
} from './dto/publication-inbox.dto';
import {
  DispatchPublishWebhookResponseDto,
} from '../product/dto/product-publish-webhook.dto';
import { ProductPublishWebhookService } from '../product/product-publish-webhook.service';
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
    private readonly publishWebhookService: ProductPublishWebhookService,
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
      body.horizon ?? 'week',
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
    @Body() body: RegenerateInboxContentDto,
  ) {
    return this.communityManager.regeneratePostForContent(
      user.tenantId!,
      user.id,
      contentId,
      {
        feedback: body.feedback,
        visualFormat: body.visualFormat,
      },
    );
  }

  @Post('pivot-angle/:contentId')
  pivotAngle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
    @Body() body: PivotAngleInboxContentDto,
  ) {
    const angleFeedbackMap: Record<InboxPivotAngle, string> = {
      social_proof:
        'Cambia el enfoque comercial a PRUEBA SOCIAL / CASO DE ÉXITO: Relata el resultado alcanzado por un cliente real, eliminando el escepticismo inicial y demostrando cómo el producto resolvió su problema.',
      pain_agitation:
        'Cambia el enfoque comercial a DOLOR Y AGITACIÓN (Framework PAS): Describe vívidamente la frustración de seguir con el problema actual antes de presentar el producto como la única solución definitiva.',
      offer_urgency:
        'Cambia el enfoque comercial a OFERTA DIRECTA Y URGENCIA (FOMO): Enfatiza por qué actuar ahora con un llamado a la acción contundente, destacando beneficio inmediato.',
      contrarian:
        'Cambia el enfoque comercial a VERDAD CONTRARIA (Derribar mito): Desafía una creencia popular errónea de la industria y explica por qué nuestro método es superior.',
      educational_step:
        'Cambia el enfoque comercial a GUÍA / PASO A PASO EDUCATIVO (Framework BAB): Enseña 3 pasos prácticos para resolver la situación, posicionando nuestro producto como el vehículo que lo hace automático.',
    };

    const feedback = angleFeedbackMap[body.angleType] ?? angleFeedbackMap.social_proof;
    return this.communityManager.regeneratePostForContent(
      user.tenantId!,
      user.id,
      contentId,
      { feedback },
    );
  }

  @Post('dismiss/:contentId')
  dismissRejected(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
  ): Promise<DismissInboxContentResponseDto> {
    return this.inboxService.dismissRejected(user.tenantId!, contentId);
  }

  @Post('delete/:contentId')
  deleteContent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
  ): Promise<DeleteInboxContentResponseDto> {
    return this.inboxService.deleteContent(user.tenantId!, contentId);
  }

  @Post('bulk-delete')
  bulkDelete(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: BulkDeleteInboxDto,
  ): Promise<BulkDeleteInboxResponseDto> {
    return this.inboxService.bulkDelete(user.tenantId!, body.contentIds);
  }

  @Post('purge')
  purgeInbox(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: PurgeInboxDto,
  ): Promise<BulkDeleteInboxResponseDto> {
    return this.inboxService.purgeInbox(user.tenantId!, body.scope, body.productId);
  }

  @Post('publish/:contentId')
  publishWithN8n(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId', ParseUUIDPipe) contentId: string,
  ): Promise<DispatchPublishWebhookResponseDto> {
    return this.publishWebhookService.dispatchForContent(
      user.tenantId!,
      contentId,
      'content.manual_publish',
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
