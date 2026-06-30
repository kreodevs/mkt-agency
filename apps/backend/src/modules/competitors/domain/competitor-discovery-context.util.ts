import { ResolvedProfileValues } from '../../company-profile/services/profile-section-sync.service';
import {
  CompetitorDiscoveryContext,
  DiscoveredCompetitorResult,
} from '../adapters/competitor-discovery.adapter.port';

const INDUSTRY_LABELS: Record<string, string> = {
  retail: 'Retail / eCommerce de consumo',
  services: 'Servicios profesionales / agencias',
  health: 'Salud',
  tech: 'Tecnología / software / SaaS',
  other: 'Otro',
};

const GENERIC_RETAIL_NAMES = [
  'walmart',
  'chedraui',
  'soriana',
  'liverpool',
  'mercado libre',
  'amazon',
  'la comer',
  'costco',
  "sam's club",
  'oxxo',
  'bodega aurrera',
  'elektra',
  'coppel',
  'farmacias guadalajara',
  'sanborns',
  'palacio de hierro',
  'sears',
];

const RETAIL_INDUSTRY_KEYWORDS =
  /supermercado|hipermercado|tienda departamental|marketplace|retail|e-?commerce de consumo|cadena comercial/i;

export function formatIndustryLabel(code: string | null | undefined): string | null {
  if (!code?.trim()) {
    return null;
  }
  const normalized = code.trim().toLowerCase();
  return INDUSTRY_LABELS[normalized] ?? code.trim();
}

export function extractProductSummary(
  values: ResolvedProfileValues,
  brandBrief?: Record<string, unknown> | null,
): string | null {
  if (brandBrief) {
    for (const key of [
      'valueProposition',
      'productDescription',
      'summary',
      'whatWeDo',
      'businessDescription',
    ]) {
      const value = brandBrief[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  const hints = [
    values.website ? `Sitio: ${values.website}` : null,
    values.brandVoice ? `Propuesta: ${values.brandVoice}` : null,
    values.objectives.length > 0 ? `Objetivos: ${values.objectives.join('; ')}` : null,
    values.targetAudienceDesc ? `Audiencia: ${values.targetAudienceDesc}` : null,
  ].filter(Boolean);

  return hints.length > 0 ? hints.join('. ') : null;
}

export function hasMinimalDiscoveryContext(
  values: ResolvedProfileValues,
  brandBriefExcerpt: string | null,
): boolean {
  if (brandBriefExcerpt?.trim()) {
    return true;
  }

  return (
    !!values.companyName?.trim() &&
    (!!values.industry?.trim() || !!values.website?.trim()) &&
    (!!values.targetAudienceDesc?.trim() || !!values.brandVoice?.trim())
  );
}

export function isRetailBusiness(context: CompetitorDiscoveryContext): boolean {
  const industry = (context.industry ?? '').trim().toLowerCase();
  if (industry === 'retail') {
    return true;
  }

  const corpus = [
    context.industryLabel,
    context.productSummary,
    context.brandBriefExcerpt,
    context.brandVoice,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return /retail|e-?commerce|tienda en línea|supermercado|productos de consumo|moda y hogar/.test(
    corpus,
  );
}

export function filterIrrelevantCompetitors(
  context: CompetitorDiscoveryContext,
  items: DiscoveredCompetitorResult[],
): DiscoveredCompetitorResult[] {
  if (isRetailBusiness(context)) {
    return items;
  }

  const existing = new Set(
    (context.existingCompetitorNames ?? []).map((name) => name.trim().toLowerCase()),
  );

  return items.filter((item) => {
    const nameKey = item.name.trim().toLowerCase();
    if (existing.has(nameKey)) {
      return false;
    }

    if (GENERIC_RETAIL_NAMES.some((blocked) => nameKey.includes(blocked))) {
      return false;
    }

    const descriptor = `${item.industry ?? ''} ${item.rationale ?? ''}`.toLowerCase();
    if (RETAIL_INDUSTRY_KEYWORDS.test(descriptor)) {
      return false;
    }

    return true;
  });
}
