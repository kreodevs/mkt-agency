import {
  Controller,
  ForbiddenException,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { TenantWebhookService } from '../social-inbox/services/tenant-webhook.service';

@Controller('tenant')
@UseGuards(TenantGuard)
export class TenantWebhookInfoController {
  constructor(private readonly webhooks: TenantWebhookService) {}

  @Get('webhook-info')
  async getWebhookInfo(@CurrentUser() user: AuthenticatedUser) {
    if (!user.tenantId) {
      throw new ForbiddenException({ error: 'Tenant required', code: 'FORBIDDEN' });
    }
    const info = await this.webhooks.getOrCreateSecret(user.tenantId);
    return {
      webhookUrl: info.webhookPath,
      secret: info.secret,
      header: 'X-Webhook-Secret',
      exampleBody: {
        message: '¿Cuánto cuesta?',
        platform: 'instagram',
        channel: 'comment',
        authorHandle: '@cliente',
      },
    };
  }
}
