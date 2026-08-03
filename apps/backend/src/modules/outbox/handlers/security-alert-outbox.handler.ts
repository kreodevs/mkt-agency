import { Inject, Injectable } from '@nestjs/common';
import {
  SECURITY_ALERT_NOTIFIER,
  SecurityAlertNotifierPort,
  SecurityAlertPayload,
} from '../../security/adapters/security-alert-notifier.port';
import { SECURITY_ALERT_OUTBOX_EVENT } from '../../security/domain/security-alert.constants';
import type { OutboxEntity } from '../../company-profile/infrastructure/typeorm/outbox.entity';
import type { OutboxHandlerPort } from '../outbox-handler.port';

@Injectable()
export class SecurityAlertOutboxHandler implements OutboxHandlerPort {
  readonly eventType = SECURITY_ALERT_OUTBOX_EVENT;

  constructor(
    @Inject(SECURITY_ALERT_NOTIFIER)
    private readonly notifier: SecurityAlertNotifierPort,
  ) {}

  async handle(entry: OutboxEntity): Promise<void> {
    await this.notifier.notify(entry.payload as unknown as SecurityAlertPayload);
  }
}
