import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/molecules/Card';
import { StatusPill } from '@/components/atoms/StatusPill';
import type { CompetitorAnalysis } from '@/types/agents';

const STATUS_LABELS: Record<CompetitorAnalysis['status'], string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
};

const STATUS_TONE: Record<
  CompetitorAnalysis['status'],
  'success' | 'warning' | 'error' | 'neutral'
> = {
  pending: 'warning',
  processing: 'warning',
  completed: 'success',
  failed: 'error',
};

interface CompetitorIntelHistoryProps {
  analyses: CompetitorAnalysis[];
  selectedId?: string | null;
}

export function CompetitorIntelHistory({ analyses, selectedId }: CompetitorIntelHistoryProps) {
  if (analyses.length === 0) {
    return null;
  }

  return (
    <Card title="Historial de análisis" subtitle="Competitor Intel">
      <div className="divide-y divide-[var(--border)]">
        {analyses.map((analysis) => {
          const isSelected = analysis.id === selectedId;

          return (
            <div
              key={analysis.id}
              className={`flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 ${
                isSelected ? 'rounded-lg bg-[var(--secondary)]/40 -mx-2 px-2' : ''
              }`}
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {new Date(analysis.createdAt).toLocaleString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {analysis.competitorsInput?.trim() || 'Competidores del perfil de empresa'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <StatusPill status={STATUS_TONE[analysis.status]}>
                  {STATUS_LABELS[analysis.status]}
                </StatusPill>
                <Link
                  to={`/agents/competitor-intel?analysis=${analysis.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  Ver reporte
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
