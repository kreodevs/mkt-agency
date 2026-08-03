import { Injectable } from '@nestjs/common';
import type { OutboxHandlerPort } from './outbox-handler.port';
import { CompanyProfileCompletedOutboxHandler } from './handlers/company-profile-completed-outbox.handler';
import { ContentApprovedOutboxHandler } from './handlers/content-approved-outbox.handler';
import { ProposalSignedOutboxHandler } from './handlers/proposal-signed-outbox.handler';
import { SecurityAlertOutboxHandler } from './handlers/security-alert-outbox.handler';

@Injectable()
export class OutboxHandlerRegistry {
  private readonly byEventType = new Map<string, OutboxHandlerPort>();

  constructor(
    securityAlert: SecurityAlertOutboxHandler,
    proposalSigned: ProposalSignedOutboxHandler,
    companyProfileCompleted: CompanyProfileCompletedOutboxHandler,
    contentApproved: ContentApprovedOutboxHandler,
  ) {
    for (const handler of [
      securityAlert,
      proposalSigned,
      companyProfileCompleted,
      contentApproved,
    ]) {
      this.byEventType.set(handler.eventType, handler);
    }
  }

  get(eventType: string): OutboxHandlerPort | undefined {
    return this.byEventType.get(eventType);
  }

  registeredEventTypes(): string[] {
    return [...this.byEventType.keys()];
  }
}
