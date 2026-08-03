import type { OutboxEntity } from '../company-profile/infrastructure/typeorm/outbox.entity';

export interface OutboxHandlerPort {
  readonly eventType: string;
  handle(entry: OutboxEntity): Promise<void>;
}
