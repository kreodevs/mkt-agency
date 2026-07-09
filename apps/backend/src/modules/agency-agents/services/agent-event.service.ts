import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import type { AgentEventType, AgentEventStatus } from '../domain/agent-events.constants';
import { AgentRole } from '../domain/agent-role.enum';
import { AgentEventLogEntity } from '../infrastructure/typeorm/agent-event-log.entity';
import { OperatingProfileService } from './operating-profile.service';

export interface LogAgentEventInput {
  tenantId: string;
  sourceAgent: AgentRole | string;
  eventType: AgentEventType | string;
  payload?: Record<string, unknown>;
  productId?: string | null;
  campaignId?: string | null;
  targetAgent?: AgentRole | string | null;
  correlationId?: string | null;
  status?: AgentEventStatus;
}

@Injectable()
export class AgentEventService {
  constructor(
    @InjectRepository(AgentEventLogEntity)
    private readonly events: Repository<AgentEventLogEntity>,
    private readonly operatingProfile: OperatingProfileService,
  ) {}

  async log(input: LogAgentEventInput): Promise<AgentEventLogEntity> {
    const row = this.events.create({
      tenantId: input.tenantId,
      productId: input.productId ?? null,
      campaignId: input.campaignId ?? null,
      correlationId: input.correlationId ?? randomUUID(),
      sourceAgent: input.sourceAgent,
      targetAgent: input.targetAgent ?? null,
      eventType: input.eventType,
      status: input.status ?? 'completed',
      payload: input.payload ?? {},
    });
    return this.events.save(row);
  }

  async logIfAgentActive(
    role: AgentRole,
    input: Omit<LogAgentEventInput, 'sourceAgent'> & { sourceAgent?: AgentRole | string },
  ): Promise<AgentEventLogEntity | null> {
    const profile = await this.operatingProfile.getProfile(input.tenantId);
    if (!this.operatingProfile.canActivateAgent(profile, role)) {
      return this.log({
        ...input,
        sourceAgent: input.sourceAgent ?? role,
        status: 'skipped',
        payload: {
          ...(input.payload ?? {}),
          reason: 'agent_inactive_for_profile',
          subProfile: this.operatingProfile.resolveSubProfile(profile),
        },
      });
    }
    return this.log({ ...input, sourceAgent: input.sourceAgent ?? role });
  }

  async listForTenant(
    tenantId: string,
    options: { limit?: number; productId?: string } = {},
  ): Promise<AgentEventLogEntity[]> {
    const qb = this.events
      .createQueryBuilder('e')
      .where('e.tenant_id = :tenantId', { tenantId })
      .orderBy('e.created_at', 'DESC')
      .take(options.limit ?? 50);

    if (options.productId) {
      qb.andWhere('e.product_id = :productId', { productId: options.productId });
    }

    return qb.getMany();
  }
}
