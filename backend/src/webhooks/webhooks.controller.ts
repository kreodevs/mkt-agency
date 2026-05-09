import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('oraltrack')
  @HttpCode(200)
  async oralTrack(@Body() body: any) {
    return this.webhooksService.handleOralTrackEvent(body);
  }

  @Post('hermes-proposal')
  @HttpCode(200)
  async hermesProposal(@Body() body: any) {
    return this.webhooksService.handleHermesProposal(body);
  }
}