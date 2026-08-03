import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEntity } from '../company-profile/infrastructure/typeorm/outbox.entity';
import { OutboxHandlerRegistry } from './outbox-handler.registry';

@Injectable()
export class OutboxDispatcherService implements OnModuleInit {
  private readonly logger = new Logger(OutboxDispatcherService.name);

  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outbox: Repository<OutboxEntity>,
    private readonly registry: OutboxHandlerRegistry,
  ) {}

  onModuleInit(): void {
    this.logger.log(
      `Outbox handlers registered: ${this.registry.registeredEventTypes().join(', ')}`,
    );
  }

  async dispatchPending(limit = 50): Promise<number> {
    const pending = await this.outbox.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
      take: limit,
    });

    let processed = 0;

    for (const entry of pending) {
      const handler = this.registry.get(entry.eventType);
      if (!handler) {
        continue;
      }

      try {
        await handler.handle(entry);
        entry.status = 'processed';
        entry.processedAt = new Date();
        await this.outbox.save(entry);
        processed += 1;
      } catch (error) {
        this.logger.error(
          `Outbox dispatch failed id=${entry.id} type=${entry.eventType}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    if (processed > 0) {
      this.logger.log(`Processed ${processed} outbox event(s)`);
    }

    return processed;
  }
}
