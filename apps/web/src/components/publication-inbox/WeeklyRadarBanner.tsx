import { useState } from 'react';
import { Compass, Sparkles, ChevronDown, Eye, Target, Lightbulb, Users } from 'lucide-react';
import type { CopilotStatus } from '@/types/publication-inbox';
import { StatusPill } from '@/components/atoms/StatusPill';

interface WeeklyRadarBannerProps {
  status?: CopilotStatus | null;
}

export function WeeklyRadarBanner({ status }: WeeklyRadarBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!status || !status.onboardingCompleted) {
    return null;
  }

  const intel = status.intelSummary;
  const hasGaps = (intel?.marketGaps?.length ?? 0) > 0;
  const hasRecommendation = Boolean(intel?.recommendation);
  const competitorsCount = status.competitorsCount ?? 0;

  return (
    <section
      aria-label="Radar estratégico semanal"
      className="rounded-[var(--radius-lg)] border border-[var(--primary)]/20 bg-[var(--background)]/75 p-3.5 shadow-sm backdrop-blur-md transition-all duration-300"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Radar de Oportunidad Semanal
              </h2>
              {competitorsCount > 0 ? (
                <StatusPill status="success" size="sm" icon={<Users className="h-3 w-3" />}>
                  {competitorsCount} competidores activos
                </StatusPill>
              ) : (
                <StatusPill status="info" size="sm">
                  Monitoreo automático
                </StatusPill>
              )}
            </div>
            <p className="text-[11px] text-[var(--foreground-muted)] line-clamp-1">
              {hasRecommendation
                ? intel!.recommendation
                : 'La IA analiza a tus competidores locales para darte ventaja comercial en cada post.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
          aria-expanded={expanded}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>{expanded ? 'Ocultar análisis' : 'Ver análisis IA'}</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {expanded && (
        <div className="mt-3 grid gap-2.5 border-t border-[var(--border)]/60 pt-3 text-xs sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)]/60 p-2.5">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
              <Target className="h-3.5 w-3.5 text-[var(--destructive)]" />
              <span>Vacíos de mercado de tu competencia</span>
            </div>
            {hasGaps ? (
              <ul className="mt-1.5 space-y-1 text-[11px] text-[var(--foreground-muted)]">
                {intel!.marketGaps.slice(0, 3).map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[var(--primary)]">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">
                Tus rivales tienen poca presencia activa en formatos cortos (Reels/TikTok). Aprovechamos esta ventana de oportunidad.
              </p>
            )}
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)]/60 p-2.5">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
              <Lightbulb className="h-3.5 w-3.5 text-[var(--warning)]" />
              <span>Estrategia recomendada para {status.productName}</span>
            </div>
            <p className="mt-1.5 text-[11px] text-[var(--foreground-muted)] leading-relaxed">
              {intel?.recommendation ||
                'Enfocar el contenido de esta semana en demostraciones de producto y resolución ágil de objeciones para capturar prospectos indecisos.'}
            </p>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-[var(--brand)] font-medium">
              <Sparkles className="h-3 w-3" />
              <span>Aplicado automáticamente en las publicaciones sugeridas abajo.</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

