export interface CompetitorIntelSocialCopyBrief {
  analysisId: string;
  generatedAt: string;
  threatLevel: string | null;
  competitorLandscape: string | null;
  recommendation: string | null;
  marketGaps: string[];
  keyInsights: string[];
  competitors: Array<{
    name: string;
    marketPosition: string | null;
    differentiator: string | null;
    strengths: string[];
    weaknesses: string[];
  }>;
  trackedCompetitorNames: string[];
}

function pickString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function pickStringArray(value: unknown, limit = 6): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean)
    .slice(0, limit);
}

export function buildCompetitorIntelBriefForSocialCopy(input: {
  analysisId: string;
  generatedAt: string;
  analysis: Record<string, unknown> | null | undefined;
  trackedCompetitorNames?: string[];
}): CompetitorIntelSocialCopyBrief | null {
  if (!input.analysis || typeof input.analysis !== 'object') {
    if (!input.trackedCompetitorNames?.length) {
      return null;
    }

    return {
      analysisId: input.analysisId,
      generatedAt: input.generatedAt,
      threatLevel: null,
      competitorLandscape: null,
      recommendation: null,
      marketGaps: [],
      keyInsights: [],
      competitors: [],
      trackedCompetitorNames: input.trackedCompetitorNames.slice(0, 12),
    };
  }

  const analysis = input.analysis;
  const competitorsRaw = Array.isArray(analysis.competitors) ? analysis.competitors : [];

  const competitors = competitorsRaw
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    .map((entry) => ({
      name: pickString(entry.name) ?? 'Competidor',
      marketPosition: pickString(entry.marketPosition),
      differentiator: pickString(entry.differentiator),
      strengths: pickStringArray(entry.strengths, 4),
      weaknesses: pickStringArray(entry.weaknesses, 4),
    }))
    .filter((entry) => entry.name.length >= 2)
    .slice(0, 8);

  const brief: CompetitorIntelSocialCopyBrief = {
    analysisId: input.analysisId,
    generatedAt: input.generatedAt,
    threatLevel: pickString(analysis.threatLevel),
    competitorLandscape: pickString(analysis.competitorLandscape)?.slice(0, 1200) ?? null,
    recommendation: pickString(analysis.recommendation)?.slice(0, 1200) ?? null,
    marketGaps: pickStringArray(analysis.marketGaps, 6),
    keyInsights: pickStringArray(analysis.keyInsights, 6),
    competitors,
    trackedCompetitorNames: (input.trackedCompetitorNames ?? []).slice(0, 12),
  };

  const hasSignal =
    !!brief.competitorLandscape ||
    !!brief.recommendation ||
    brief.marketGaps.length > 0 ||
    brief.keyInsights.length > 0 ||
    brief.competitors.length > 0 ||
    brief.trackedCompetitorNames.length > 0;

  return hasSignal ? brief : null;
}
