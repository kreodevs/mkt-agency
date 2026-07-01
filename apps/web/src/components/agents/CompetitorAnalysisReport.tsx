import { AlertTriangle, CheckCircle, ShieldAlert, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { Card } from '@/components/molecules/Card';

interface CompetitorAnalysis {
  competitorLandscape?: string;
  competitors?: Array<{
    name: string;
    strengths?: string | string[];
    weaknesses?: string | string[];
    positioning?: string;
    [key: string]: unknown;
  }>;
  marketGaps?: string | string[];
  threatLevel?: string;
  recommendation?: string;
  keyInsights?: string | string[];
  [key: string]: unknown;
}

interface CompetitorAnalysisReportProps {
  analysis: CompetitorAnalysis;
}

function ThreatBadge({ level }: { level: string }) {
  const normalized = level.toLowerCase().trim();
  const isHigh = normalized.includes('alto') || normalized.includes('high') || normalized.includes('crítico') || normalized.includes('critical');
  const isMedium = normalized.includes('medio') || normalized.includes('medium') || normalized.includes('moderado') || normalized.includes('moderate');

  if (isHigh) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        <ShieldAlert className="h-3.5 w-3.5" />
        Amenaza Alta
      </span>
    );
  }
  if (isMedium) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        Amenaza Media
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      <CheckCircle className="h-3.5 w-3.5" />
      Amenaza Baja
    </span>
  );
}

function renderList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    if (value.includes('\n')) return value.split('\n').map((s) => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
    if (value.includes(',')) return value.split(',').map((s) => s.trim()).filter(Boolean);
    return [value];
  }
  return [];
}

export function CompetitorAnalysisReport({ analysis }: CompetitorAnalysisReportProps) {
  if (!analysis) return null;

  const landscape = analysis.competitorLandscape || '';
  const competitors = analysis.competitors || [];
  const gaps = renderList(analysis.marketGaps as string | string[]);
  const threatLevel = analysis.threatLevel || '';
  const recommendation = analysis.recommendation || '';
  const insights = renderList(analysis.keyInsights as string | string[]);

  return (
    <div className="space-y-6">
      {/* Landscape + Threat */}
      {(landscape || threatLevel) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {landscape && (
            <div className="flex-1 text-sm leading-relaxed text-[var(--foreground)]">{landscape}</div>
          )}
          {threatLevel && (
            <div className="shrink-0">
              <ThreatBadge level={threatLevel} />
            </div>
          )}
        </div>
      )}

      {/* Competitors */}
      {competitors.length > 0 && (
        <Card title="Competidores Analizados" subtitle={`${competitors.length} en total`}>
          <div className="divide-y divide-[var(--border)]">
            {competitors.map((c, i) => (
              <div key={c.name ?? i} className="px-[var(--spacing-md)] py-[var(--spacing-sm)] first:pt-[var(--spacing-md)] last:pb-[var(--spacing-md)]">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-[var(--foreground)]">{c.name}</span>
                </div>
                {c.positioning && (
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">{c.positioning}</p>
                )}
                {(c.strengths || c.weaknesses) && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {c.strengths && (
                      <div className="rounded-md bg-emerald-50/50 p-2 text-xs text-emerald-800">
                        <span className="font-medium">Fortalezas:</span>
                        <ul className="mt-1 list-disc pl-4 space-y-0.5">
                          {renderList(typeof c.strengths === 'string' ? c.strengths : Array.isArray(c.strengths) ? c.strengths as string[] : undefined).map((s, j) => (
                            <li key={j}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.weaknesses && (
                      <div className="rounded-md bg-red-50/50 p-2 text-xs text-red-800">
                        <span className="font-medium">Debilidades:</span>
                        <ul className="mt-1 list-disc pl-4 space-y-0.5">
                          {renderList(typeof c.weaknesses === 'string' ? c.weaknesses : Array.isArray(c.weaknesses) ? c.weaknesses as string[] : undefined, '').map((s, j) => (
                            <li key={j}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Market Gaps */}
      {gaps.length > 0 && (
        <Card title="Oportunidades de Mercado" subtitle="Nichos sin explotar identificados">
          <div className="px-[var(--spacing-md)] pb-[var(--spacing-md)]">
            <ul className="space-y-2">
              {gaps.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Target className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                  <span className="text-[var(--foreground)]">{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Recommendation */}
      {recommendation && (
        <Card title="Recomendación Estratégica">
          <div className="px-[var(--spacing-md)] pb-[var(--spacing-md)]">
            <p className="text-sm leading-relaxed text-[var(--foreground)]">{recommendation}</p>
          </div>
        </Card>
      )}

      {/* Key Insights */}
      {insights.length > 0 && (
        <Card title="Insights Clave">
          <div className="px-[var(--spacing-md)] pb-[var(--spacing-md)]">
            <ul className="space-y-2">
              {insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                  <span className="text-[var(--foreground)]">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}
