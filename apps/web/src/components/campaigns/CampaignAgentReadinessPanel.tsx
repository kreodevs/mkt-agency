import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { Progress } from '@/components/molecules/Progress';
import type { CampaignAgentReadiness } from '@/types/campaign';

interface CampaignAgentReadinessPanelProps {
  readiness: CampaignAgentReadiness;
  loading?: boolean;
  onAutoGenerate: () => void;
}

export function CampaignAgentReadinessPanel({
  readiness,
  loading,
  onAutoGenerate,
}: CampaignAgentReadinessPanelProps) {
  const progress = Math.round((readiness.requiredCompleted / readiness.requiredTotal) * 100);

  return (
    <Card
      title="Campaña automática desde agentes"
      subtitle={
        readiness.ready
          ? 'Tienes el contexto necesario. La IA creará campaña, estrategia y vinculará contenidos.'
          : 'Completa los agentes requeridos para habilitar la generación automática.'
      }
    >
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
          <span>
            Agentes requeridos: {readiness.requiredCompleted}/{readiness.requiredTotal}
          </span>
          <span className="font-medium tabular-nums text-[var(--foreground)]">{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>

      <ul className="mb-4 space-y-2">
        {readiness.items.map((item) => (
          <li
            key={item.key}
            className="flex items-start gap-3 rounded-lg border border-[var(--border)] px-3 py-2.5"
          >
            {item.complete ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
            ) : (
              <AlertCircle
                className={`mt-0.5 h-4 w-4 shrink-0 ${item.required ? 'text-amber-600' : 'text-[var(--foreground-subtle)]'}`}
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {item.label}
                  {!item.required && (
                    <span className="ml-1 text-xs font-normal text-[var(--foreground-subtle)]">
                      (recomendado)
                    </span>
                  )}
                </p>
                {!item.complete && (
                  <Link
                    to={item.href}
                    className="text-xs font-medium text-[var(--primary)] hover:underline"
                  >
                    Ir
                  </Link>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mb-4 rounded-lg bg-[var(--secondary)]/50 px-3 py-2.5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
          Qué se generará en marketing
        </p>
        <ul className="space-y-1 text-sm text-[var(--foreground-muted)]">
          {readiness.deliverables.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>

      <Button
        type="button"
        className="gap-2"
        loading={loading}
        disabled={!readiness.ready}
        onClick={onAutoGenerate}
      >
        <Sparkles className="h-4 w-4" />
        Crear campaña automáticamente
      </Button>
    </Card>
  );
}
