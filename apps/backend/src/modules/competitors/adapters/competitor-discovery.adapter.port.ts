export const COMPETITOR_DISCOVERY_ADAPTER = Symbol('COMPETITOR_DISCOVERY_ADAPTER');

export type CompetitorDiscoveryScope = 'global' | 'country' | 'city';

export interface CompetitorDiscoveryContext {
  scope: CompetitorDiscoveryScope;
  country?: string | null;
  city?: string | null;
  companyName?: string | null;
  industry?: string | null;
  industryLabel?: string | null;
  targetAudience?: string | null;
  website?: string | null;
  brandVoice?: string | null;
  objectives?: string[];
  productSummary?: string | null;
  brandBriefExcerpt?: string | null;
  existingCompetitorNames?: string[];
}

export interface DiscoveredCompetitorResult {
  name: string;
  website?: string | null;
  industry?: string | null;
  rationale?: string | null;
}

export interface CompetitorDiscoveryAdapterPort {
  discover(context: CompetitorDiscoveryContext): Promise<DiscoveredCompetitorResult[]>;
}
