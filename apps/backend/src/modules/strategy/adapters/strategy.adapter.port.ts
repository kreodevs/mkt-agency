import { SuggestionStatus, StrategySource } from '../domain/strategy.constants';

export interface StrategySuggestion {
  id: string;
  channel: string;
  currentPerformance: string;
  insight: string;
  recommendation: string;
  actionType: 'adjust_content' | 'reallocate_budget' | 'change_strategy' | 'pause_channel' | 'amplify';
  expectedImpact: string;
  status: SuggestionStatus;
}

export interface StrategyAnalysisData {
  summary: string;
  overallHealth: 'good' | 'fair' | 'poor';
  topPerforming: string[];
  underperforming: string[];
  suggestions: StrategySuggestion[];
  generatedAt: string;
}

export interface StrategyAdjustmentAdapterPort {
  analyze(context: {
    tenantId: string;
    source: StrategySource;
    brandBrief?: Record<string, unknown> | null;
    metrics: {
      leads: { total: number; byStage: Record<string, number>; conversionRate: number };
      content: { total: number; byStatus: Record<string, number>; approvalRate: number };
      campaigns: { total: number; active: number; byStatus: Record<string, number> };
      trends: Array<{ month: string; count: number }>;
    };
    campaigns: Array<{ id: string; name: string; status: string; platforms: string[]; objective: string | null }>;
  }): Promise<StrategyAnalysisData>;
}

export const STRATEGY_ADAPTER = Symbol('STRATEGY_ADAPTER');