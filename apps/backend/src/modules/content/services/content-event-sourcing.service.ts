import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { EventEntity } from '../infrastructure/typeorm/event.entity';

@Injectable()
export class ContentEventSourcingService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly events: Repository<EventEntity>,
  ) {}

  async append(
    manager: EntityManager,
    params: {
      contentId: string;
      eventType: string;
      data: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    const repo = manager.getRepository(EventEntity);
    const last = await repo.findOne({
      where: { aggregateType: 'content', aggregateId: params.contentId },
      order: { version: 'DESC' },
    });

    const nextVersion = (last?.version ?? 0) + 1;

    await repo.save(
      repo.create({
        aggregateType: 'content',
        aggregateId: params.contentId,
        version: nextVersion,
        eventType: params.eventType,
        data: params.data,
        metadata: params.metadata ?? {},
      }),
    );
  }
}
