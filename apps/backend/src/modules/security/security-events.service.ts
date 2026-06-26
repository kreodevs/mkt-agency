import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListSecurityEventsQueryDto } from './dto/list-security-events.query.dto';
import { SecurityEventEntity } from './infrastructure/typeorm/security-event.entity';

@Injectable()
export class SecurityEventsService {
  constructor(
    @InjectRepository(SecurityEventEntity)
    private readonly events: Repository<SecurityEventEntity>,
  ) {}

  async list(query: ListSecurityEventsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.events
      .createQueryBuilder('event')
      .orderBy('event.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.severity) {
      qb.andWhere('event.severity = :severity', { severity: query.severity });
    }

    if (query.eventType) {
      qb.andWhere('event.event_type = :eventType', {
        eventType: query.eventType,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        severity: event.severity,
        userId: event.userId,
        tenantId: event.tenantId,
        metadata: event.metadata,
        ipAddress: event.ipAddress,
        createdAt: event.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}
