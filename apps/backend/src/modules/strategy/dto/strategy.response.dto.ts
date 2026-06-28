import type { StrategySource, SuggestionStatus, StrategyStatus } from '../domain/strategy.constants';

export interface StrategySuggestionResponse {
  id: string;
  channel: string;
  currentPerformance: string;
  insight: string;
  recommendation: string;
  actionType: string;
  expectedImpact: string;
  status: SuggestionStatus;
}

export interface StrategyAdjustmentResponse {
  id: string;
  tenantId: string;
  status: StrategyStatus;
  source: StrategySource;
  brandBriefId: string | null;
  data: Record<string, unknown>;
  suggestions: StrategySuggestionResponse[];
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TriggerAnalysisResponse {
  id: string;
  status: string;
}