import { DiscoveredCompetitorResult } from '../adapters/competitor-discovery.adapter.port';

export interface WebSearchEvidence {
  query: string;
  hits: Array<{ title: string; url: string; snippet: string }>;
}

export function competitorsFromWebEvidence(
  evidence: WebSearchEvidence[],
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
  evidence: WebSearchEvidence[],
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
