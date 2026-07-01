import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Megaphone, Sparkles, UserRound } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { Progress } from '@/components/molecules/Progress';
import type { CampaignAgentReadiness, CampaignExecutionMode } from '@/types/campaign';
import { executionModeLabel } from '@/utils/campaignExecutionMode';

interface CampaignAgentReadinessPanelProps {
  readiness: CampaignAgentReadiness;
  executionMode: CampaignExecutionMode;
  onExecutionModeChange: (mode: CampaignExecutionMode) => void;
  loading?: boolean;
  onAutoGenerate: () => void;
}

const MODE_COPY: Record<
  CampaignExecutionMode,
  { subtitleReady: string; subtitlePending: string; cta: string }
> = {
  organic: {
    subtitleReady:
      'Tienes el contexto necesario. Crearemos la campaña editorial y vincularemos posts para que publiques tú mismo.',
    subtitlePending:
      'Completa perfil y Community Manager para habilitar la campaña con publicación manual.',
    cta: 'Crear campaña editorial',
  },
  paid: {
    subtitleReady:
      'Tienes el contexto necesario. La IA creará campaña, estrategia de medios y presupuestos por plataforma.',
    subtitlePending:
      'Completa los agentes requeridos (incluye Estrategia) para campañas de medios pagados.',
    cta: 'Crear campaña de medios pagados',
  },
};

export function CampaignAgentReadinessPanel({
  readiness,
  executionMode,
  onExecutionModeChange,
  loading,
  onAutoGenerate,
}: CampaignAgentReadinessPanelProps) {
  const progress =
    readiness.requiredTotal > 0
      ? Math.round((readiness.requiredCompleted / readiness.requiredTotal) * 100)
      : 0;
  const copy = MODE_COPY[executionMode];

  return (
    <Card
      title="Campaña automática desde agentes"
      subtitle={readiness.ready ? copy.subtitleReady : copy.subtitlePending}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={executionMode === 'organic' ? 'default' : 'outline'}
          className="gap-2"
          onClick={() => onExecutionModeChange('organic')}
        >
          <UserRound className="h-4 w-4" />
          Publicación orgánica
        </Button>
        <Button
          type="button"
          size="sm"
          variant={executionMode === 'paid' ? 'default' : 'outline'}
          className="gap-2"
          onClick={() => onExecutionModeChange('paid')}
        >
          <Megaphone className="h-4 w-4" />
          Medios pagados
        </Button>
      </div>

      <p className="mb-4 text-xs text-[var(--foreground-muted)]">
        Modo activo: <span className="font-medium text-[var(--foreground)]">{executionModeLabel(executionMode)}</span>
        {executionMode === 'organic'
          ? ' — para SoHo que publica en redes sin Ads Manager.'
          : ' — requiere configurar anuncios en Meta/Google/LinkedIn.'}
      </p>

      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
          <span>
            Agentes requeridos: {readiness.requiredCompleted}/{readiness.requiredTotal}
          </span>
          <span className="font-medium tabular-nums text-[var(--foreground)]">{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>

      <ul className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {readiness.items.map((item) => (
          <li
            key={item.key}
            className="flex h-full flex-col gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5"
          >
            <div className="flex items-start gap-2">
              {item.complete ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
              ) : (
                <AlertCircle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${item.required ? 'text-amber-600' : 'text-[var(--foreground-subtle)]'}`}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <p className="text-sm font-medium leading-snug text-[var(--foreground)]">
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
              </div>
            </div>
            <p className="line-clamp-3 text-xs leading-relaxed text-[var(--foreground-muted)]">
              {item.description}
            </p>
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
        {copy.cta}
      </Button>
    </Card>
  );
}
