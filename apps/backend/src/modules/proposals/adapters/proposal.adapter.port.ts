export interface ProposalGenerationContext {
  tenantId: string;
  title: string;
  campaign: {
    id: string;
    name: string;
    objective: string | null;
    platforms: string[];
    totalBudget: number | null;
    strategy: Record<string, unknown>;
  } | null;
  companyProfile: {
    companyName: string | null;
    industry: string | null;
    brandVoice: string | null;
    targetAudienceDesc: string | null;
    objectives: string | null | unknown[];
  } | null;
}

export interface GeneratedProposalContent {
  summary: string;
  objectives: string[];
  strategy: string;
  budget: {
    total: number;
    breakdown: Array<{ item: string; amount: number }>;
  };
  timeline: Array<{ phase: string; duration: string }>;
  deliverables: string[];
}

export interface ProposalAdapterPort {
  generate(context: ProposalGenerationContext): Promise<GeneratedProposalContent>;
}

export const PROPOSAL_ADAPTER = Symbol('PROPOSAL_ADAPTER');
