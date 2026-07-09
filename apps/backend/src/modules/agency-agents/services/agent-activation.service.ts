import { Injectable } from '@nestjs/common';
import { OperatingProfileService } from './operating-profile.service';
import { AgentRole } from '../domain/agent-role.enum';
import type {
  AgentActivationMatrix,
  OperatingSubProfile,
  TenantOperatingProfile,
} from '../domain/operating-profile.types';
import { agentActivationLevel } from '../domain/agent-activation.constants';

export interface AgentCapabilitiesSnapshot {
  subProfile: OperatingSubProfile;
  operatingProfile: TenantOperatingProfile;
  activation: AgentActivationMatrix;
  agents: Record<
    AgentRole,
    { active: boolean; level: AgentActivationMatrix[keyof AgentActivationMatrix] }
  >;
}

@Injectable()
export class AgentActivationService {
  constructor(private readonly operatingProfile: OperatingProfileService) {}

  async getCapabilities(tenantId: string): Promise<AgentCapabilitiesSnapshot> {
    const operatingProfile = await this.operatingProfile.getProfile(tenantId);
    const subProfile = this.operatingProfile.resolveSubProfile(operatingProfile);
    const activation = this.operatingProfile.getActivationMatrix(operatingProfile);

    const agents = {} as AgentCapabilitiesSnapshot['agents'];
    for (const role of Object.values(AgentRole)) {
      const level = agentActivationLevel(activation, role);
      agents[role] = { active: level !== 'off', level };
    }

    return { subProfile, operatingProfile, activation, agents };
  }
}
