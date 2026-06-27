import { Injectable, Logger } from '@nestjs/common';
import {
  SecurityAlertNotifierPort,
  SecurityAlertPayload,
} from './security-alert-notifier.port';

/** Fallback notifier when Slack is not configured (dev / tests). */
@Injectable()
export class LoggingSecurityAlertAdapter implements SecurityAlertNotifierPort {
  private readonly logger = new Logger(LoggingSecurityAlertAdapter.name);

  async notify(payload: SecurityAlertPayload): Promise<void> {
    this.logger.warn(
      `SecurityAlert ${payload.severity} ${payload.eventType} event=${payload.securityEventId}`,
    );
  }
}
