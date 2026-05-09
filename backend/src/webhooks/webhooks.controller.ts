import { Controller, Post, Get, Body, Query, Param, HttpCode } from '@nestjs/common';
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

  @Get('proposals-debug')
  async proposalsDebug(@Query('tenantId') tenantId: string) {
    return this.webhooksService.getProposalsDebug(tenantId);
  }

  @Post('proposal-approve')
  @HttpCode(200)
  async proposalApprove(@Body() body: { proposalId: string; feedback?: string }) {
    return this.webhooksService.approveProposal(body.proposalId, body.feedback);
  }

  @Post('proposal-reject')
  @HttpCode(200)
  async proposalReject(@Body() body: { proposalId: string; reason?: string }) {
    return this.webhooksService.rejectProposal(body.proposalId, body.reason);
  }

  @Get('tenants-debug')
  async tenantsDebug() {
    return this.webhooksService.getTenantsDebug();
  }

  @Get('my-tenant')
  async myTenant(@Query('userId') userId: string) {
    return this.webhooksService.getMyTenant(userId);
  }

  @Get('products-debug')
  async productsDebug(@Query('tenantId') tenantId: string) {
    return this.webhooksService.getProductsDebug(tenantId);
  }

  @Post('products-update')
  @HttpCode(200)
  async updateProduct(@Body() body: { productId: string; description?: string; brandContext?: Record<string, any> }) {
    return this.webhooksService.updateProduct(body);
  }
}