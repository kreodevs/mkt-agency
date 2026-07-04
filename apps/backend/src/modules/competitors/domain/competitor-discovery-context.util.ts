import { ResolvedProfileValues } from '../../company-profile/services/profile-section-sync.service';
import {
  CompetitorDiscoveryContext,
  CompetitorDiscoveryScope,
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

export function buildDiscoverySearchQueries(context: CompetitorDiscoveryContext): string[] {
  const intentQueries = buildCompetitorIntentQueries(context);
  const keywordQueries = buildKeywordDiscoveryQueries(context);
  const queries = [...new Set([...intentQueries, ...keywordQueries].map((query) => query.trim()).filter(Boolean))];

  if (queries.length < 2) {
    queries.push(...buildFallbackDiscoveryQueries(context));
  }

  return [...new Set(queries.map((query) => query.trim()).filter(Boolean))].slice(0, 12);
}

function buildFallbackDiscoveryQueries(context: CompetitorDiscoveryContext): string[] {
  const queries: string[] = [];
  const geo = discoveryGeoLabel(context);
  const keywords = (context.productKeywords ?? []).filter(Boolean);
  const productName = context.productName?.trim();
  const category = context.productCategory?.trim();

  if (productName) {
    queries.push(geo ? `competidores ${productName} ${geo}` : `competidores ${productName}`);
    queries.push(geo ? `alternativas a ${productName} ${geo}` : `alternativas ${productName}`);
  }

  if (category) {
    queries.push(geo ? `empresas ${category} ${geo}` : `empresas ${category} competidores`);
  }

  for (const keyword of keywords.slice(0, 3)) {
    queries.push(geo ? `${keyword} empresas ${geo}` : `${keyword} competidores`);
  }

  if (context.companyName?.trim() && context.industryLabel) {
    queries.push(
      geo
        ? `competidores ${context.companyName.trim()} ${context.industryLabel} ${geo}`
        : `competidores ${context.companyName.trim()} ${context.industryLabel}`,
    );
  }

  return queries;
}

function discoveryGeoLabel(context: CompetitorDiscoveryContext): string {
  if (context.scope === 'global') {
    return '';
  }
  if (context.scope === 'country') {
    return (context.country ?? '').trim();
  }
  return `${context.city ?? ''} ${context.country ?? ''}`.trim();
}

function discoveryCorpus(context: CompetitorDiscoveryContext): string {
  return [
    context.productName,
    context.productSummary,
    context.brandBriefExcerpt,
    context.productCategory,
    context.targetAudience,
    context.brandVoice,
    ...(context.productKeywords ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function buildCompetitorIntentQueries(context: CompetitorDiscoveryContext): string[] {
  const queries: string[] = [];
  const geo = discoveryGeoLabel(context);
  const keywords = (context.productKeywords ?? []).filter(Boolean).slice(0, 6);
  const corpus = discoveryCorpus(context);
  const primaryPhrase = keywords.slice(0, 2).join(' ').trim();

  const isEventsVertical =
    /bodas?|wedding|xv a[nñ]os|eventos?|invitaci[oó]n|fiesta|planner|wedding planner|mesas|rsvp|galer[ií]a|álbum|album|fotos invitados|\bqr\b|proyecci[oó]n en vivo|live photo|memori|recuerd|celebraci[oó]n|colaborativ/i.test(
      corpus,
    );

  if (isEventsVertical) {
    if (geo) {
      queries.push(`plataformas invitación digital bodas ${geo}`);
      queries.push(`álbum colaborativo fotos invitados evento ${geo}`);
      queries.push(`software eventos digitales planners ${geo} competidores`);
      queries.push(`apps invitación digital RSVP bodas ${geo}`);
      queries.push(`memoria digital eventos fotos invitados ${geo}`);
      queries.push(`galería colaborativa fotos boda ${geo}`);
    } else {
      queries.push('plataformas invitación digital bodas competidores');
      queries.push('álbum colaborativo fotos invitados evento software');
      queries.push('apps memoria digital eventos competidores');
    }
  }

  const isSaaSVertical = /saas|software|plataforma|app\b|digital|suscripci[oó]n/i.test(corpus);
  if (isSaaSVertical && primaryPhrase) {
    queries.push(geo ? `alternativas ${primaryPhrase} ${geo}` : `alternativas ${primaryPhrase}`);
    queries.push(geo ? `mejores ${primaryPhrase} ${geo} comparativa` : `mejores ${primaryPhrase}`);
  }

  if (context.productCategory?.trim()) {
    const category = context.productCategory.trim();
    queries.push(geo ? `${category} empresas ${geo}` : `empresas ${category} competidores`);
  }

  if (context.productName?.trim() && geo) {
    queries.push(`competidores ${context.productName.trim()} ${geo}`);
  }

  return queries;
}

function buildKeywordDiscoveryQueries(context: CompetitorDiscoveryContext): string[] {
  const queries: string[] = [];
  const keywords = (context.productKeywords ?? []).filter(Boolean).slice(0, 8);
  const geo = discoveryGeoLabel(context);

  for (const keyword of keywords.slice(0, 5)) {
    queries.push(geo ? `empresas ${keyword} ${geo}` : `alternativas a ${keyword}`);
    queries.push(geo ? `${keyword} competidores ${geo}` : `competidores ${keyword}`);
  }

  if (keywords.length >= 2) {
    queries.push(
      geo
        ? `${keywords[0]} ${keywords[1]} ${geo}`
        : `empresas como ${keywords[0]} ${keywords[1]}`,
    );
  }

  if (context.productSummary?.trim()) {
    const summaryWords = context.productSummary
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .slice(0, 4)
      .join(' ');
    if (summaryWords) {
      queries.push(geo ? `${summaryWords} ${geo}` : summaryWords);
    }
  }

  return queries;
}

export function competitorsFromWebEvidence(
  evidence: Array<{
    query: string;
    hits: Array<{ title: string; url: string; snippet: string }>;
  }>,
): DiscoveredCompetitorResult[] {
  const skipHosts = new Set([
    'facebook',
    'instagram',
    'linkedin',
    'twitter',
    'youtube',
    'tiktok',
    'google',
    'wikipedia',
    'mercadolibre',
    'amazon',
    'pinterest',
    'reddit',
  ]);
  const seenDomains = new Set<string>();
  const results: DiscoveredCompetitorResult[] = [];

  for (const entry of evidence) {
    for (const hit of entry.hits) {
      let host: string | null = null;
      try {
        host = new URL(hit.url).hostname.replace(/^www\./, '').toLowerCase();
      } catch {
        continue;
      }

      const brand = host.split('.')[0];
      if (!brand || brand.length < 4 || skipHosts.has(brand) || seenDomains.has(host)) {
        continue;
      }

      seenDomains.add(host);
      const titleLead = hit.title.split(/\s*[|\-–—:·]\s*/)[0]?.trim();
      const name =
        titleLead && titleLead.length >= 3 && titleLead.length <= 80
          ? titleLead
          : brand.charAt(0).toUpperCase() + brand.slice(1);

      results.push({
        name,
        website: host,
        industry: null,
        rationale:
          hit.snippet?.trim().slice(0, 220) ||
          `Mencionado en resultados web para "${entry.query}".`,
      });

      if (results.length >= 12) {
        return results;
      }
    }
  }

  return results;
}

export function extractWebSearchCandidates(
  evidence: Array<{
    query: string;
    hits: Array<{ title: string; url: string; snippet: string }>;
  }>,
): string[] {
  const candidates = new Set<string>();
  const skipHosts = new Set([
    'facebook',
    'instagram',
    'linkedin',
    'twitter',
    'youtube',
    'tiktok',
    'google',
    'wikipedia',
    'mercadolibre',
    'amazon',
  ]);

  for (const entry of evidence) {
    for (const hit of entry.hits) {
      const titleLead = hit.title.split(/\s*[|\-–—:·]\s*/)[0]?.trim();
      if (titleLead && titleLead.length >= 3 && titleLead.length <= 80) {
        candidates.add(titleLead);
      }

      try {
        const host = new URL(hit.url).hostname.replace(/^www\./, '').toLowerCase();
        const brand = host.split('.')[0];
        if (brand && brand.length >= 4 && !skipHosts.has(brand)) {
          candidates.add(brand);
        }
      } catch {
        // ignore malformed URLs
      }
    }
  }

  return [...candidates].slice(0, 40);
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
    .split('/')[0];
}
