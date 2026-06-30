import { AgentType } from '../domain/agent-interview.entity';

export interface InterviewContext {
  agentType: AgentType;
  tenantId: string;
  currentStep: number;
  totalSteps: number;
  answers: Record<string, unknown>;
  profile: {
    companyName?: string | null;
    industry?: string | null;
    website?: string | null;
    brandVoice?: string | null;
    targetAudienceDesc?: string | null;
    competitors?: string | null;
    objectives?: string | null;
  };
  product?: {
    id: string;
    name: string;
    description: string | null;
    valueProposition: string | null;
    targetAudience: string | null;
  } | null;
}