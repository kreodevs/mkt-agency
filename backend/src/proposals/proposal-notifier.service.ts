import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Proposal } from './entities/proposal.entity';

@Injectable()
export class ProposalNotifierService {
  private readonly logger = new Logger(ProposalNotifierService.name);

  constructor(private configService: ConfigService) {}

  async notifyCreated(proposal: Proposal): Promise<void> {
    await this.sendWebhook({
      type: 'proposal.created',
      proposalId: proposal.id,
      tenantId: proposal.tenantId,
      actionType: proposal.actionType,
      rationale: proposal.rationale,
      payload: proposal.payload,
      status: proposal.status,
    });
  }

  async notifyApproved(proposal: Proposal): Promise<void> {
    await this.sendWebhook({
      type: 'proposal.approved',
      proposalId: proposal.id,
      actionType: proposal.actionType,
      status: 'approved',
    });
  }

  async notifyRejected(proposal: Proposal, reason?: string): Promise<void> {
    await this.sendWebhook({
      type: 'proposal.rejected',
      proposalId: proposal.id,
      actionType: proposal.actionType,
      rejectionReason: reason || proposal.rejectionReason,
    });
  }

  async notifyExecuted(proposal: Proposal): Promise<void> {
    await this.sendWebhook({
      type: 'proposal.executed',
      proposalId: proposal.id,
      actionType: proposal.actionType,
      resultSummary: proposal.resultSummary,
    });
  }

  private async sendWebhook(payload: any): Promise<void> {
    const url = this.configService.get<string>('HERMES_WEBHOOK_URL');
    if (!url) {
      this.logger.warn('HERMES_WEBHOOK_URL no configurada — omitiendo notificación');
      return;
    }
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        this.logger.warn(`Webhook a Hermes respondió ${response.status}`);
      }
    } catch (err: any) {
      this.logger.error(`Error enviando webhook a Hermes: ${err.message}`);
    }
  }
}
