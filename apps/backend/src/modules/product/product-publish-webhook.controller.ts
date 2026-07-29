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
import { MarkPublishedWebhookDto } from './dto/product-publish-webhook.dto';
import { ProductPublishIntegrationService } from './product-publish-integration.service';
import { ProductPublishWebhookService } from './product-publish-webhook.service';

@Controller('publication-inbox/webhook')
export class ProductPublishWebhookController {
  constructor(
    private readonly webhookService: ProductPublishWebhookService,
    private readonly integrationService: ProductPublishIntegrationService,
  ) {}

  @Public()
  @Post(':tenantId/mark-published')
  @HttpCode(HttpStatus.OK)
  async markPublished(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Headers('x-webhook-secret') secret: string | undefined,
    @Body() body: MarkPublishedWebhookDto,
  ) {
    await this.integrationService.validateWebhookSecret(tenantId, body.productId, secret);
    return this.webhookService.markPublished({
      tenantId,
      productId: body.productId,
      contentId: body.contentId,
      externalPostId: body.externalPostId,
    });
  }
}
