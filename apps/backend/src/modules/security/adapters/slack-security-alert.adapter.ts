import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SecurityAlertNotifierPort,
  SecurityAlertPayload,
} from './security-alert-notifier.port';

@Injectable()
export class SlackSecurityAlertAdapter implements SecurityAlertNotifierPort {
  private readonly logger = new Logger(SlackSecurityAlertAdapter.name);

  constructor(private readonly config: ConfigService) {}

  async notify(payload: SecurityAlertPayload): Promise<void> {
    const webhookUrl = this.config.get<string>('SLACK_SECURITY_WEBHOOK_URL');

    const text = [
      `:rotating_light: *Security alert* (${payload.severity.toUpperCase()})`,
      `*Type:* ${payload.eventType}`,
      `*Event ID:* ${payload.securityEventId}`,
      payload.userId ? `*User:* ${payload.userId}` : null,
      payload.tenantId ? `*Tenant:* ${payload.tenantId}` : null,
      payload.ipAddress ? `*IP:* ${payload.ipAddress}` : null,
      payload.metadata && Object.keys(payload.metadata).length > 0
        ? `*Metadata:* \`${JSON.stringify(payload.metadata)}\``
        : null,
    ]
      .filter(Boolean)
      .join('\n');

    if (!webhookUrl) {
      this.logger.warn(`SLACK_SECURITY_WEBHOOK_URL not set; alert not sent: ${text}`);
      return;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed with status ${response.status}`);
    }
  }
}
