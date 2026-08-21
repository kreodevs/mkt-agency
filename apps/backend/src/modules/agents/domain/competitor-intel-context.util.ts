import { ResolvedProfileValues } from '../../company-profile/services/profile-section-sync.service';
import {
  extractStructuredBriefExcerpt,
} from '../../competitors/domain/competitor-context.helpers';
import {
  productSummaryForDiscovery,
  ProductContext,
} from '../../product/domain/product-context.util';

export interface CompetitorIntelContext {
  companyName?: string | null;
  industry?: string | null;
  targetAudience?: string | null;
  brandVoice?: string | null;
  objectives?: string[];
  productName?: string | null;
  productSummary?: string | null;
  valueProposition?: string | null;
  brandBriefExcerpt?: string | null;
}

export function buildCompetitorIntelContext(input: {
  profile: ResolvedProfileValues;
  product?: ProductContext | null;
  brandBrief?: Record<string, unknown> | null;
  brandBriefMarkdown?: string | null;
}): CompetitorIntelContext {
  const brandBriefExcerpt =
    extractStructuredBriefExcerpt(input.brandBriefMarkdown, input.brandBrief) ?? null;

  const productSummary = productSummaryForDiscovery(
    input.product ?? null,
    input.profile,
    input.brandBrief ?? null,
  );

  return {
    companyName: input.profile.companyName,
    industry: input.profile.industry,
    targetAudience: input.product?.targetAudience ?? input.profile.targetAudienceDesc,
    brandVoice: input.profile.brandVoice,
    objectives: input.profile.objectives,
    productName: input.product?.name ?? null,
    productSummary,
    valueProposition:
      input.product?.valueProposition?.trim() ||
      (typeof input.brandBrief?.valueProposition === 'string'
        ? input.brandBrief.valueProposition.trim()
        : null) ||
      null,
    brandBriefExcerpt,
  };
}
