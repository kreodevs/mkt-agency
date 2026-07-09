import { AgentRole } from './agent-role.enum';
import type { AgentActivationMatrix, OperatingSubProfile } from './operating-profile.types';

export const AGENT_ACTIVATION_BY_SUBPROFILE: Record<
  OperatingSubProfile,
  AgentActivationMatrix
> = {
  soho: {
    strategist: 'lite',
    analytics: 'lite',
    media_buyer: 'off',
    creative: 'full',
    community: 'lite',
  },
  growth_organic: {
    strategist: 'standard',
    analytics: 'standard',
    media_buyer: 'off',
    creative: 'full',
    community: 'optional',
  },
  growth_paid: {
    strategist: 'full',
    analytics: 'full',
    media_buyer: 'full',
    creative: 'full',
    community: 'full',
  },
};

export function isAgentActive(
  matrix: AgentActivationMatrix,
  role: AgentRole,
): boolean {
  const key = role as keyof AgentActivationMatrix;
  const level = matrix[key];
  return level !== 'off';
}

export function agentActivationLevel(
  matrix: AgentActivationMatrix,
  role: AgentRole,
): AgentActivationMatrix[keyof AgentActivationMatrix] {
  return matrix[role as keyof AgentActivationMatrix];
}
