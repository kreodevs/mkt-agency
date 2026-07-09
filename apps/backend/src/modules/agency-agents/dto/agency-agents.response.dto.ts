import type { AgentPlanEntity } from '../infrastructure/typeorm/agent-plan.entity';
import type { AgentEventLogEntity } from '../infrastructure/typeorm/agent-event-log.entity';
import type { TenantOperatingProfile } from '../domain/operating-profile.types';
import type { AgentCapabilitiesSnapshot } from '../services/agent-activation.service';

export interface OperatingProfileResponseDto {
  profile: TenantOperatingProfile;
  subProfile: string;
  capabilities: AgentCapabilitiesSnapshot['agents'];
}

export function toOperatingProfileResponse(
  snapshot: AgentCapabilitiesSnapshot,
): OperatingProfileResponseDto {
  return {
    profile: snapshot.operatingProfile,
    subProfile: snapshot.subProfile,
    capabilities: snapshot.agents,
  };
}

export interface AgentPlanResponseDto {
  id: string;
  productId: string | null;
  status: string;
  strategistOutput: Record<string, unknown>;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toAgentPlanResponse(plan: AgentPlanEntity): AgentPlanResponseDto {
  return {
    id: plan.id,
    productId: plan.productId,
    status: plan.status,
    strategistOutput: plan.strategistOutput,
    approvedAt: plan.approvedAt?.toISOString() ?? null,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

export interface AgentEventResponseDto {
  id: string;
  sourceAgent: string;
  targetAgent: string | null;
  eventType: string;
  status: string;
  productId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export function toAgentEventResponse(event: AgentEventLogEntity): AgentEventResponseDto {
  return {
    id: event.id,
    sourceAgent: event.sourceAgent,
    targetAgent: event.targetAgent,
    eventType: event.eventType,
    status: event.status,
    productId: event.productId,
    payload: event.payload,
    createdAt: event.createdAt.toISOString(),
  };
}
