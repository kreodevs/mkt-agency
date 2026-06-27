import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEntity } from '../../company-profile/infrastructure/typeorm/outbox.entity';
import {
  isAlertSeverity,
  SECURITY_ALERT_OUTBOX_EVENT,
} from '../domain/security-alert.constants';
import { SecurityEventEntity } from '../infrastructure/typeorm/security-event.entity';

@Injectable()
export class SecurityAlertObserver {
  private readonly logger = new Logger(SecurityAlertObserver.name);

  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outbox: Repository<OutboxEntity>,
  ) {}

  async handle(event: SecurityEventEntity): Promise<void> {
    if (!isAlertSeverity(event.severity)) {
      return;
    }

    await this.outbox.save(
      this.outbox.create({
        aggregateType: 'security_event',
        aggregateId: event.id,
        eventType: SECURITY_ALERT_OUTBOX_EVENT,
        payload: {
          securityEventId: event.id,
          eventType: event.eventType,
          severity: event.severity,
          userId: event.userId,
          tenantId: event.tenantId,
          metadata: event.metadata,
          ipAddress: event.ipAddress,
          createdAt: event.createdAt.toISOString(),
        },
        status: 'pending',
      }),
    );

    this.logger.warn(
      `Security alert queued: ${event.eventType} (${event.severity}) id=${event.id}`,
    );
  }
}
