import { Injectable, Logger } from '@nestjs/common';
import { CompanyProfileCompletedEvent } from '../../company-profile/events/company-profile-completed.event';
import type { OutboxEntity } from '../../company-profile/infrastructure/typeorm/outbox.entity';
import type { OutboxHandlerPort } from '../outbox-handler.port';

@Injectable()
export class CompanyProfileCompletedOutboxHandler implements OutboxHandlerPort {
  readonly eventType = CompanyProfileCompletedEvent.eventType;
  private readonly logger = new Logger(CompanyProfileCompletedOutboxHandler.name);

  async handle(entry: OutboxEntity): Promise<void> {
    this.logger.log(
      `Company profile completed tenant=${String(entry.payload.tenantId)} profile=${entry.aggregateId} at ${entry.payload.completionPercentage ?? '?'}%`,
    );
  }
}
