import {
  CompetitorDiscoveryContext,
  DiscoveredCompetitorResult,
} from '../adapters/competitor-discovery.adapter.port';
import { GENERIC_RETAIL_NAMES, RETAIL_INDUSTRY_KEYWORDS } from './competitor-context.constants';
import { isRetailBusiness } from './competitor-context.helpers';

export function filterIrrelevantCompetitors(
  context: CompetitorDiscoveryContext,
  items: DiscoveredCompetitorResult[],
): DiscoveredCompetitorResult[] {
  if (isRetailBusiness(context)) {
    return dedupeCompetitorResults(items, context);
  }

  return applyStrictCompetitorFilters(context, items);
}

export function filterIrrelevantCompetitorsWithFallback(
  context: CompetitorDiscoveryContext,
  items: DiscoveredCompetitorResult[],
): DiscoveredCompetitorResult[] {
  const strict = filterIrrelevantCompetitors(context, items);
  if (strict.length >= 2) {
    return strict;
  }

  const relaxed = applyRelaxedCompetitorFilters(context, items);
  return relaxed.length > strict.length ? relaxed : strict;
}

function applyStrictCompetitorFilters(
  context: CompetitorDiscoveryContext,
  items: DiscoveredCompetitorResult[],
): DiscoveredCompetitorResult[] {
  const blockedNames = buildBlockedCompetitorNames(context);
  const seenDomains = new Set<string>();

  return items.filter((item) => {
    if (!passesBlockedNameChecks(context, item, blockedNames)) {
      return false;
    }

    if (GENERIC_RETAIL_NAMES.some((blocked) => item.name.trim().toLowerCase().includes(blocked))) {
      return false;
    }

    const descriptor = `${item.industry ?? ''} ${item.rationale ?? ''}`.toLowerCase();
    if (RETAIL_INDUSTRY_KEYWORDS.test(descriptor)) {
      return false;
    }

    const domain = normalizeWebsiteDomain(item.website);
    if (domain) {
      if (seenDomains.has(domain)) {
        return false;
      }
      seenDomains.add(domain);
    }

    if (!item.rationale?.trim() || item.rationale.trim().length < 8) {
      return false;
    }

    return true;
  });
}

function applyRelaxedCompetitorFilters(
  context: CompetitorDiscoveryContext,
  items: DiscoveredCompetitorResult[],
): DiscoveredCompetitorResult[] {
  const blockedNames = buildBlockedCompetitorNames(context);
  const seenDomains = new Set<string>();

  return items.filter((item) => {
    if (!passesBlockedNameChecks(context, item, blockedNames)) {
      return false;
    }

    if (GENERIC_RETAIL_NAMES.some((blocked) => item.name.trim().toLowerCase().includes(blocked))) {
      return false;
    }

    const domain = normalizeWebsiteDomain(item.website);
    if (domain) {
      if (seenDomains.has(domain)) {
        return false;
      }
      seenDomains.add(domain);
    }

    return item.name.trim().length >= 2;
  });
}

function buildBlockedCompetitorNames(context: CompetitorDiscoveryContext): Set<string> {
  return new Set(
    [
      ...(context.existingCompetitorNames ?? []),
      ...(context.knownCompetitorNames ?? []),
      context.companyName,
    ]
      .filter(Boolean)
      .map((name) => name!.trim().toLowerCase()),
  );
}

function passesBlockedNameChecks(
  context: CompetitorDiscoveryContext,
  item: DiscoveredCompetitorResult,
  blockedNames: Set<string>,
): boolean {
  const nameKey = item.name.trim().toLowerCase();
  if (blockedNames.has(nameKey)) {
    return false;
  }

  if (context.companyName && nameKey.includes(context.companyName.trim().toLowerCase())) {
    return false;
  }

  return true;
}

function dedupeCompetitorResults(
  items: DiscoveredCompetitorResult[],
  context: CompetitorDiscoveryContext,
): DiscoveredCompetitorResult[] {
  const blockedNames = new Set(
    (context.existingCompetitorNames ?? []).map((name) => name.trim().toLowerCase()),
  );
  const seenDomains = new Set<string>();

  return items.filter((item) => {
    const nameKey = item.name.trim().toLowerCase();
    if (blockedNames.has(nameKey)) {
      return false;
    }
    const domain = normalizeWebsiteDomain(item.website);
    if (domain) {
      if (seenDomains.has(domain)) {
        return false;
      }
      seenDomains.add(domain);
    }
    return true;
  });
}

function normalizeWebsiteDomain(website?: string | null): string | null {
  if (!website?.trim()) {
    return null;
  }
  return website
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0] || null;
}
