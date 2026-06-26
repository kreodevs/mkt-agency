import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../users/infrastructure/typeorm/audit-log.entity';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs.query.dto';
import { PaginatedAuditLogsResponseDto } from './dto/audit-log.response.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly logs: Repository<AuditLogEntity>,
  ) {}

  async list(query: ListAuditLogsQueryDto): Promise<PaginatedAuditLogsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.logs
      .createQueryBuilder('log')
      .orderBy('log.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.tenantId) {
      qb.andWhere('log.tenant_id = :tenantId', { tenantId: query.tenantId });
    }

    if (query.action) {
      qb.andWhere('log.action ILIKE :action', { action: `%${query.action}%` });
    }

    if (query.from) {
      qb.andWhere('log.created_at >= :from', { from: query.from });
    }

    if (query.to) {
      qb.andWhere('log.created_at <= :to', { to: query.to });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((log) => ({
        id: log.id,
        tenantId: log.tenantId,
        userId: log.userId,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        details: log.details,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }
}
