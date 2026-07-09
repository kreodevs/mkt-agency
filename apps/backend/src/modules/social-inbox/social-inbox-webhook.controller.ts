import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Public } from '../../shared/decorators/public.decorator';
import { IngestSocialInteractionDto } from './dto/social-inbox.request.dto';
import { SocialInboxService } from './services/social-inbox.service';
import { TenantWebhookService } from './services/tenant-webhook.service';

@Controller('social-inbox/webhook')
export class SocialInboxWebhookController {
  constructor(
    private readonly inbox: SocialInboxService,
    private readonly webhooks: TenantWebhookService,
  ) {}

  @Public()
  @Post(':tenantId')
  @HttpCode(HttpStatus.CREATED)
  async receive(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Headers('x-webhook-secret') secret: string | undefined,
    @Body() body: IngestSocialInteractionDto,
  ) {
    await this.webhooks.validateSecret(tenantId, secret);
    return this.inbox.ingest(tenantId, body);
  }
}
