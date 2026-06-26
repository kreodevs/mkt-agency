export interface StrategyGenerationContext {
  tenantId: string;
  campaign: {
    id: string;
    name: string;
    objective: string | null;
    platforms: string[];
    totalBudget: number | null;
  };
  companyProfile: {
    companyName: string | null;
    industry: string | null;
    brandVoice: string | null;
    targetAudienceDesc: string | null;
    objectives: string | null | unknown[];
  };
}

export interface GeneratedStrategyResult {
  strategy: Record<string, unknown>;
  budgets: Array<{
    platform: string;
    dailyBudget: number;
    totalBudget: number;
  }>;
}

export interface StrategyAdapterPort {
  generate(context: StrategyGenerationContext): Promise<GeneratedStrategyResult>;
}

export const STRATEGY_ADAPTER = Symbol('STRATEGY_ADAPTER');
