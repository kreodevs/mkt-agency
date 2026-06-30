import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/molecules/Card';
import { StatusPill } from '@/components/atoms/StatusPill';
import type { AgentInterview } from '@/types/agents';
import { getEffectiveInterviewStatus } from '@/utils/brandInterview';

const STATUS_LABELS: Record<AgentInterview['status'], string> = {
  in_progress: 'En progreso',
  completed: 'Completada',
  failed: 'Fallida',
};

interface BrandInterviewHistoryProps {
  interviews: AgentInterview[];
}

export function BrandInterviewHistory({ interviews }: BrandInterviewHistoryProps) {
  if (interviews.length === 0) {
    return null;
  }

  return (
    <Card title="Historial de entrevistas" subtitle="Brand Analyst">
      <div className="divide-y divide-[var(--border)]">
        {interviews.map((interview) => {
          const status = getEffectiveInterviewStatus(interview);

          return (
          <div
            key={interview.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {new Date(interview.createdAt).toLocaleString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {interview.productName
                  ? `Producto: ${interview.productName} · `
                  : ''}
                {status === 'completed'
                  ? 'Brand Brief generado'
                  : status === 'failed'
                    ? (interview.errorMessage ?? 'Error al generar el brief')
                    : `${interview.currentStep} de ${interview.totalSteps} preguntas`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <StatusPill
                status={
                  status === 'completed'
                    ? 'success'
                    : status === 'failed'
                      ? 'error'
                      : 'warning'
                }
              >
                {STATUS_LABELS[status]}
              </StatusPill>
              <Link
                to={`/agents/brand-interview/${interview.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
              >
                {status === 'in_progress' ? 'Continuar' : 'Ver resultado'}
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
