import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '../../tenant/infrastructure/typeorm/tenant.entity';
import { SecurityEventEntity } from '../infrastructure/typeorm/security-event.entity';
import { SecurityAlertObserver } from '../observers/security-alert.observer';

@Injectable()
export class SecurityEventRecorderService {
  constructor(
    @InjectRepository(SecurityEventEntity)
    private readonly events: Repository<SecurityEventEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
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
    const { tenantId, metadata } = await this.resolveTenantContext(
      params.tenantId,
      params.metadata,
    );

    const event = this.events.create({
      eventType: params.eventType,
      severity: params.severity,
      userId: params.userId ?? null,
      tenantId,
      metadata,
      ipAddress: params.ipAddress ?? null,
    });

    const saved = await this.events.save(event);
    await this.securityAlertObserver.handle(saved);
    return saved;
  }

  private async resolveTenantContext(
    tenantId: string | null | undefined,
    metadata: Record<string, unknown> | undefined,
  ): Promise<{ tenantId: string | null; metadata: Record<string, unknown> }> {
    const baseMetadata = metadata ?? {};

    if (!tenantId) {
      return { tenantId: null, metadata: baseMetadata };
    }

    const exists = await this.tenants.exist({ where: { id: tenantId } });
    if (exists) {
      return { tenantId, metadata: baseMetadata };
    }

    return {
      tenantId: null,
      metadata: { ...baseMetadata, orphanTenantId: tenantId },
    };
  }
}
