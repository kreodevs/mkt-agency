import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityEventEntity } from '../infrastructure/typeorm/security-event.entity';
import { SecurityAlertObserver } from '../observers/security-alert.observer';

@Injectable()
export class SecurityEventRecorderService {
  constructor(
    @InjectRepository(SecurityEventEntity)
    private readonly events: Repository<SecurityEventEntity>,
    private readonly securityAlertObserver: SecurityAlertObserver,
  ) {}

  async record(params: {
    eventType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string | null;
    tenantId?: string | null;
    metadata?: Record<string, unknown>;
    ipAddress?: string | null;
  }): Promise<SecurityEventEntity> {
    const event = this.events.create({
      eventType: params.eventType,
      severity: params.severity,
      userId: params.userId ?? null,
      tenantId: params.tenantId ?? null,
      metadata: params.metadata ?? {},
      ipAddress: params.ipAddress ?? null,
    });

    const saved = await this.events.save(event);
    await this.securityAlertObserver.handle(saved);
    return saved;
  }
}
