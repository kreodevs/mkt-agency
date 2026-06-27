export interface CompetitorIntelAdapterPort {
  generateAnalysis(competitors: string, tenantContext: {
    companyName?: string | null;
    industry?: string | null;
    targetAudience?: string | null;
  }): Promise<Record<string, unknown>>;
}

export const COMPETITOR_INTEL_ADAPTER = Symbol('COMPETITOR_INTEL_ADAPTER');