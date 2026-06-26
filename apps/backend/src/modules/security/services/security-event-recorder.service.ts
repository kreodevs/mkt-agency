import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityEventEntity } from '../infrastructure/typeorm/security-event.entity';

@Injectable()
export class SecurityEventRecorderService {
  constructor(
    @InjectRepository(SecurityEventEntity)
    private readonly events: Repository<SecurityEventEntity>,
  ) {}

  async record(params: {
    eventType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string | null;
    tenantId?: string | null;
    metadata?: Record<string, unknown>;
    ipAddress?: string | null;
  }): Promise<void> {
    const event = this.events.create({
      eventType: params.eventType,
      severity: params.severity,
      userId: params.userId ?? null,
      tenantId: params.tenantId ?? null,
      metadata: params.metadata ?? {},
      ipAddress: params.ipAddress ?? null,
    });

    await this.events.save(event);
  }
}
