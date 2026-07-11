import { ResolvedProfileValues } from '../../company-profile/services/profile-section-sync.service';
import {
  CompetitorDiscoveryContext,
  CompetitorDiscoveryScope,
} from '../adapters/competitor-discovery.adapter.port';
import { INDUSTRY_LABELS } from './competitor-context.constants';

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

export function extractStructuredBriefExcerpt(
  brandBriefMarkdown?: string | null,
  brandBrief?: Record<string, unknown> | null,
): string | null {
  if (brandBrief) {
    const parts: string[] = [];
    for (const key of [
      'valueProposition',
      'targetAudience',
      'differentiators',
      'positioning',
      'productDescription',
      'whatWeDo',
      'summary',
    ]) {
      const value = brandBrief[key];
      if (typeof value === 'string' && value.trim()) {
        parts.push(`${key}: ${value.trim()}`);
      }
    }
    if (parts.length > 0) {
      return parts.join('\n').slice(0, 2000);
    }
  }

  if (brandBriefMarkdown?.trim()) {
    const lines = brandBriefMarkdown
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 20 && !/^#{1,6}\s/.test(line));
    if (lines.length > 0) {
      return lines.slice(0, 8).join('\n').slice(0, 2000);
    }
  }

  return null;
}

export function parseKnownCompetitorsFromProfile(text?: string | null): string[] {
  if (!text?.trim()) {
    return [];
  }

  return [
    ...new Set(
      text
        .split(/[\n,;|]+/)
        .map((entry) => entry.replace(/\s*[—–-]\s*.*$/, '').trim())
        .filter((entry) => entry.length >= 2),
    ),
  ].slice(0, 20);
}

export function inferDiscoveryScope(
  targetAudience?: string | null,
): { scope: CompetitorDiscoveryScope; country?: string; city?: string } {
  const text = (targetAudience ?? '').toLowerCase();

  const cityPatterns: Array<{ pattern: RegExp; city: string }> = [
    { pattern: /\b(cdmx|ciudad de méxico|ciudad de mexico)\b/i, city: 'Ciudad de México' },
    { pattern: /\bguadalajara\b/i, city: 'Guadalajara' },
    { pattern: /\bmonterrey\b/i, city: 'Monterrey' },
    { pattern: /\bpuebla\b/i, city: 'Puebla' },
    { pattern: /\bquer[eé]taro\b/i, city: 'Querétaro' },
    { pattern: /\btijuana\b/i, city: 'Tijuana' },
    { pattern: /\ble[oó]n\b/i, city: 'León' },
    { pattern: /\bcanc[uú]n\b/i, city: 'Cancún' },
  ];

  for (const { pattern, city } of cityPatterns) {
    if (pattern.test(text)) {
      return { scope: 'city', country: 'México', city };
    }
  }

  if (/\b(m[eé]xico|mexico|mx\b|latam|latinoam[eé]rica)\b/i.test(text)) {
    return { scope: 'country', country: 'México' };
  }

  return { scope: 'global' };
}

export function hasMinimalDiscoveryContext(
  values: ResolvedProfileValues,
  brandBriefExcerpt: string | null,
  productKeywords: string[] = [],
): boolean {
  if (brandBriefExcerpt?.trim()) {
    return true;
  }

  if (productKeywords.length >= 3) {
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
