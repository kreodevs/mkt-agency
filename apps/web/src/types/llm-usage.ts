export interface LlmUsageSummary {
  totalCalls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface LlmUsageTenantRow extends LlmUsageSummary {
  tenantId: string | null;
  tenantName: string | null;
}

export interface LlmUsageDailyRow {
  day: string;
  totalCalls: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface LlmUsageDashboardResponse {
  summary: LlmUsageSummary;
  byTenant: LlmUsageTenantRow[];
  daily: LlmUsageDailyRow[];
}
