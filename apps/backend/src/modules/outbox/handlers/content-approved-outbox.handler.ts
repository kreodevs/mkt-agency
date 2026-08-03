import { Injectable, Logger } from '@nestjs/common';
import type { OutboxEntity } from '../../company-profile/infrastructure/typeorm/outbox.entity';
import type { OutboxHandlerPort } from '../outbox-handler.port';

@Injectable()
export class ContentApprovedOutboxHandler implements OutboxHandlerPort {
  readonly eventType = 'ContentApproved';
  private readonly logger = new Logger(ContentApprovedOutboxHandler.name);

  async handle(entry: OutboxEntity): Promise<void> {
    this.logger.log(
      `Content approved content=${String(entry.payload.contentId ?? entry.aggregateId)} version=${String(entry.payload.versionId ?? '—')}`,
    );
  }
}
