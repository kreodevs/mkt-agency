import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImpersonationLogEntity } from '../infrastructure/typeorm/impersonation-log.entity';

@Injectable()
export class ImpersonationLoggerService {
  constructor(
    @InjectRepository(ImpersonationLogEntity)
    private readonly logs: Repository<ImpersonationLogEntity>,
  ) {}

  async log(params: {
    superadminId: string;
    tenantId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const entry = this.logs.create({
      superadminId: params.superadminId,
      tenantId: params.tenantId,
      action: params.action,
      metadata: params.metadata ?? {},
    });

    await this.logs.save(entry);
  }
}
