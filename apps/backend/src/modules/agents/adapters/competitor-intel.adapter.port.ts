import { CompetitorIntelContext } from '../domain/competitor-intel-context.util';

export interface CompetitorIntelAdapterPort {
  generateAnalysis(
    competitors: string,
    tenantContext: CompetitorIntelContext,
  ): Promise<Record<string, unknown>>;
}

export const COMPETITOR_INTEL_ADAPTER = Symbol('COMPETITOR_INTEL_ADAPTER');