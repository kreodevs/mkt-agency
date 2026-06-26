import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../infrastructure/typeorm/audit-log.entity';

@Injectable()
export class AuditLogRecorderService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly logs: Repository<AuditLogEntity>,
  ) {}

  async record(params: {
    tenantId?: string | null;
    userId?: string | null;
    action: string;
    resourceType?: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string | null;
  }): Promise<void> {
    const entry = this.logs.create({
      tenantId: params.tenantId ?? null,
      userId: params.userId ?? null,
      action: params.action,
      resourceType: params.resourceType ?? null,
      resourceId: params.resourceId ?? null,
      details: params.details ?? {},
      ipAddress: params.ipAddress ?? null,
    });

    await this.logs.save(entry);
  }
}
