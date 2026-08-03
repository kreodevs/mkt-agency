import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { OutboxEntity } from '../../company-profile/infrastructure/typeorm/outbox.entity';
import type { OutboxHandlerPort } from '../outbox-handler.port';

@Injectable()
export class ProposalSignedOutboxHandler implements OutboxHandlerPort {
  readonly eventType = 'ProposalSigned';
  private readonly logger = new Logger(ProposalSignedOutboxHandler.name);

  constructor(private readonly config: ConfigService) {}

  async handle(entry: OutboxEntity): Promise<void> {
    const webhookUrl = this.config.get<string>('HERMES_WEBHOOK_URL')?.trim();
    if (!webhookUrl) {
      this.logger.log(
        `ProposalSigned outbox=${entry.id} proposal=${String(entry.payload.proposalId ?? entry.aggregateId)} (no HERMES_WEBHOOK_URL)`,
      );
      return;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: this.eventType,
        aggregateId: entry.aggregateId,
        payload: entry.payload,
        occurredAt: entry.createdAt.toISOString(),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Hermes webhook failed (${response.status}): ${body.slice(0, 200)}`);
    }
  }
}
