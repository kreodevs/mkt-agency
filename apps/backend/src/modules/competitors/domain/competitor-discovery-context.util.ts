/**
 * Competitor Discovery Context — Re-export barrel.
 *
 * Functions have been split into focused modules:
 * - competitor-context.constants.ts: INDUSTRY_LABELS, GENERIC_RETAIL_NAMES, RETAIL_INDUSTRY_KEYWORDS
 * - competitor-context.helpers.ts: formatIndustryLabel, extractProductSummary, etc.
 * - competitor-search-queries.ts: buildDiscoverySearchQueries, buildCompetitorIntentQueries, etc.
 * - competitor-filtering.ts: filterIrrelevantCompetitors, dedupeCompetitorResults, etc.
 * - competitor-web-evidence.ts: competitorsFromWebEvidence, extractWebSearchCandidates
 */

export { INDUSTRY_LABELS, GENERIC_RETAIL_NAMES, RETAIL_INDUSTRY_KEYWORDS } from './competitor-context.constants';

export {
  formatIndustryLabel,
  extractProductSummary,
  extractStructuredBriefExcerpt,
  parseKnownCompetitorsFromProfile,
  inferDiscoveryScope,
  hasMinimalDiscoveryContext,
  isRetailBusiness,
} from './competitor-context.helpers';

export {
  buildDiscoverySearchQueries,
  buildCompetitorIntentQueries,
} from './competitor-search-queries';

export {
  filterIrrelevantCompetitors,
  filterIrrelevantCompetitorsWithFallback,
} from './competitor-filtering';

export {
  competitorsFromWebEvidence,
  extractWebSearchCandidates,
} from './competitor-web-evidence';
