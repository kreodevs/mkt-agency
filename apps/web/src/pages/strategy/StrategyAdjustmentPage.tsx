import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Loader2,
  RotateCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { ProductContextBanner } from '@/components/products/ProductContextBanner';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { StatsCard } from '@/components/molecules/StatsCard';
import { Button } from '@/components/atoms/Button';
import { HEALTH_UI, type HealthKey } from '@/lib/semantic-ui';
import { IconButton, ACTION_BUTTON_GROUP_CLASS } from '@/components/atoms/IconButton';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { apiFetch } from '@/services/api';
import { useResolvedProductId } from '@/hooks/useResolvedProductId';

interface Suggestion {
  id: string;
  channel: string;
  currentPerformance: string;
  insight: string;
  recommendation: string;
  actionType: string;
  expectedImpact: string;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
}

interface Adjustment {
  id: string;
  tenantId: string;
  status: 'analyzing' | 'ready' | 'applied' | 'failed';
  source: string;
  brandBriefId: string | null;
  data: {
    summary?: string;
    overallHealth?: 'good' | 'fair' | 'poor';
    topPerforming?: string[];
    underperforming?: string[];
    generatedAt?: string;
  };
  suggestions: Suggestion[];
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

const ACTION_TYPE_BADGES: Record<string, { label: string; class: string }> = {
  adjust_content: { label: 'Ajustar contenido', class: 'bg-[var(--accent)]/10 text-[var(--accent)]' },
  reallocate_budget: { label: 'Reasignar presupuesto', class: 'bg-[var(--warning)]/10 text-[var(--warning)]' },
  change_strategy: { label: 'Cambiar estrategia', class: 'bg-[var(--accent)]/10 text-[var(--accent)]' },
  pause_channel: { label: 'Pausar canal', class: 'bg-[var(--destructive)]/10 text-[var(--destructive)]' },
  amplify: { label: 'Amplificar', class: 'bg-[var(--success)]/10 text-[var(--success)]' },
};

function resolveHealth(key?: string): (typeof HEALTH_UI)[HealthKey] {
  if (key === 'good' || key === 'poor') return HEALTH_UI[key];
  return HEALTH_UI.fair;
}

export default function StrategyAdjustmentPage() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const resolvedProductId = useResolvedProductId();

  const adjustmentsQuery = useQuery({
    queryKey: ['strategy-adjustments'],
    queryFn: () => apiFetch<Adjustment[]>('/strategy/adjustments'),
  });

  const triggerMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ id: string; status: string }>('/strategy/adjustments/analyze', {
        method: 'POST',
        body: JSON.stringify(resolvedProductId ? { productId: resolvedProductId } : {}),
      }),
    onSuccess: () => {
      toast.success('Análisis iniciado');
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ['strategy-adjustments'] });
      }, 2000);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al iniciar análisis');
    },
  });

  const updateSuggestionMutation = useMutation({
    mutationFn: ({
      adjustmentId,
      suggestionId,
      status,
    }: {
      adjustmentId: string;
      suggestionId: string;
      status: 'approved' | 'rejected';
    }) =>
      apiFetch<Adjustment>(
        `/strategy/adjustments/${adjustmentId}/suggestions/${suggestionId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['strategy-adjustments'] });
      toast.success('Sugerencia actualizada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al actualizar');
    },
  });

  const applyMutation = useMutation({
    mutationFn: (adjustmentId: string) =>
      apiFetch<Adjustment>(`/strategy/adjustments/${adjustmentId}/apply`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['strategy-adjustments'] });
      toast.success('Ajustes aplicados — revisa el contenido generado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al aplicar');
    },
  });

  const latest = adjustmentsQuery.data?.[0];

  return (
    <DashboardShell navigationOverride={tenantNavigation}>
      <PageHeader
        title="Recomendaciones de estrategia"
        description="Sugerencias automáticas según tus publicaciones y contactos — aprueba o descarta cada una"
        actions={
          <Button
            onClick={() => triggerMutation.mutate()}
            loading={triggerMutation.isPending}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Analizar rendimiento
          </Button>
        }
      />

      {resolvedProductId && <ProductContextBanner productId={resolvedProductId} />}

      {adjustmentsQuery.isLoading ? (
        <div className="py-20 text-center text-[var(--foreground-muted)]">
          Cargando análisis...
        </div>
      ) : !latest ? (
        <div className="space-y-6">
          <Card>
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--secondary)]">
                <Lightbulb className="h-8 w-8 text-[var(--foreground-muted)]" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[var(--foreground)]">
                  Sin análisis aún
                </p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  Presiona "Analizar rendimiento" para generar recomendaciones automáticas
                  basadas en tus métricas actuales.
                </p>
              </div>
              <Button
                onClick={() => triggerMutation.mutate()}
                loading={triggerMutation.isPending}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Comenzar análisis
              </Button>
            </div>
          </Card>
        </div>
      ) : latest.status === 'analyzing' ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" />
            <p className="text-lg font-semibold text-[var(--foreground)]">
              Analizando tu estrategia...
            </p>
            <p className="text-sm text-[var(--foreground-muted)]">
              La IA está revisando tus métricas y generando recomendaciones personalizadas.
            </p>
          </div>
        </Card>
      ) : latest.status === 'failed' ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <XCircle className="h-10 w-10 text-[var(--destructive)]" />
            <p className="text-lg font-semibold text-[var(--foreground)]">
              Error en el análisis
            </p>
            <p className="text-sm text-[var(--foreground-muted)]">
              {latest.errorMessage || 'No se pudo completar el análisis. Intenta de nuevo.'}
            </p>
            <Button
              onClick={() => triggerMutation.mutate()}
              loading={triggerMutation.isPending}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reintentar
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-[var(--spacing-lg)]">
          <div className="grid gap-[var(--spacing-md)] sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Rendimiento general"
              value={resolveHealth(latest.data.overallHealth).label}
              icon={<TrendingUp className="h-5 w-5" aria-hidden />}
              iconTone={
                latest.data.overallHealth === 'good'
                  ? 'success'
                  : latest.data.overallHealth === 'poor'
                    ? 'warning'
                    : 'warning'
              }
            />
            <StatsCard
              title="Funciona"
              value={latest.data.topPerforming?.length ?? 0}
              icon={<ThumbsUp className="h-5 w-5" aria-hidden />}
              iconTone="success"
            />
            <StatsCard
              title="No funciona"
              value={latest.data.underperforming?.length ?? 0}
              icon={<AlertCircle className="h-5 w-5" aria-hidden />}
              iconTone="warning"
            />
            <StatsCard
              title="Sugerencias"
              value={latest.suggestions.length}
              description={
                latest.suggestions.filter((s) => s.status === 'approved').length > 0
                  ? `${latest.suggestions.filter((s) => s.status === 'approved').length} aprobadas`
                  : undefined
              }
              icon={<Lightbulb className="h-5 w-5" aria-hidden />}
              iconTone="accent"
            />
          </div>

          {/* Summary */}
          <Card title="Resumen ejecutivo" subtitle={latest.createdAt ? new Date(latest.createdAt).toLocaleString('es-MX') : ''}>
            <p className="text-sm leading-relaxed text-[var(--foreground)]">
              {latest.data.summary ?? 'Sin resumen disponible.'}
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {latest.data.topPerforming && latest.data.topPerforming.length > 0 && (
                <div>
                  <p className="mb-[var(--spacing-sm)] flex items-center gap-1.5 text-sm font-semibold text-[var(--success)]">
                    <TrendingUp className="h-4 w-4" />
                    Lo que funciona
                  </p>
                  <ul className="space-y-1.5">
                    {latest.data.topPerforming.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--success)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latest.data.underperforming && latest.data.underperforming.length > 0 && (
                <div>
                  <p className="mb-[var(--spacing-sm)] flex items-center gap-1.5 text-sm font-semibold text-[var(--destructive)]">
                    <TrendingDown className="h-4 w-4" />
                    Lo que no funciona
                  </p>
                  <ul className="space-y-1.5">
                    {latest.data.underperforming.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--destructive)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {/* Suggestions */}
          <Card
            title="Sugerencias de ajuste"
            subtitle="Aprueba o rechaza cada sugerencia"
          >
            <div className="space-y-3">
              {latest.suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`rounded-[var(--radius-md)] border p-[var(--spacing-md)] transition-colors ${
                    suggestion.status === 'approved'
                      ? 'border-[var(--success)]/30 bg-[var(--success)]/5'
                      : suggestion.status === 'rejected'
                        ? 'border-[var(--destructive)]/30 bg-[var(--destructive)]/5'
                        : suggestion.status === 'applied'
                          ? 'border-[var(--success)]/40 bg-[var(--success)]/10'
                          : 'border-[var(--border)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[var(--foreground)]">
                          {suggestion.channel}
                        </span>
                        <span
                          className={`rounded-full px-[var(--spacing-sm)] py-0.5 text-xs font-semibold ${
                            ACTION_TYPE_BADGES[suggestion.actionType]?.class ??
                            'bg-[var(--secondary)] text-[var(--foreground-muted)]'
                          }`}
                        >
                          {ACTION_TYPE_BADGES[suggestion.actionType]?.label ??
                            suggestion.actionType}
                        </span>
                        {suggestion.status === 'approved' && (
                          <span className="flex items-center gap-1 text-xs font-medium text-[var(--success)]">
                            <CheckCircle2 className="h-3 w-3" />
                            Aprobada
                          </span>
                        )}
                        {suggestion.status === 'rejected' && (
                          <span className="flex items-center gap-1 text-xs font-medium text-[var(--destructive)]">
                            <XCircle className="h-3 w-3" />
                            Rechazada
                          </span>
                        )}
                        {suggestion.status === 'applied' && (
                          <span className="flex items-center gap-1 text-xs font-medium text-[var(--success)]">
                            <CheckSquare className="h-3 w-3" />
                            Aplicada
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                        {suggestion.currentPerformance}
                      </p>

                      <button
                        type="button"
                        className="mt-1 flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
                        onClick={() =>
                          setExpandedId(
                            expandedId === suggestion.id ? null : suggestion.id,
                          )
                        }
                      >
                        {expandedId === suggestion.id ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Ocultar detalle
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            Ver detalle
                          </>
                        )}
                      </button>

                      {expandedId === suggestion.id && (
                        <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
                          <p className="text-xs text-[var(--foreground)]">
                            <span className="font-medium">Insight:</span>{' '}
                            {suggestion.insight}
                          </p>
                          <p className="text-xs text-[var(--foreground)]">
                            <span className="font-medium">Recomendación:</span>{' '}
                            {suggestion.recommendation}
                          </p>
                          <p className="text-xs font-medium text-[var(--success)]">
                            Impacto esperado: {suggestion.expectedImpact}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {suggestion.status === 'pending' && (
                      <div className={ACTION_BUTTON_GROUP_CLASS}>
                        <IconButton
                          type="button"
                          tone="success"
                          label="Aprobar sugerencia"
                          loading={
                            updateSuggestionMutation.isPending &&
                            updateSuggestionMutation.variables?.suggestionId ===
                              suggestion.id
                          }
                          onClick={() =>
                            updateSuggestionMutation.mutate({
                              adjustmentId: latest.id,
                              suggestionId: suggestion.id,
                              status: 'approved',
                            })
                          }
                        >
                          <ThumbsUp />
                        </IconButton>
                        <IconButton
                          type="button"
                          tone="danger"
                          label="Rechazar sugerencia"
                          onClick={() =>
                            updateSuggestionMutation.mutate({
                              adjustmentId: latest.id,
                              suggestionId: suggestion.id,
                              status: 'rejected',
                            })
                          }
                        >
                          <ThumbsDown />
                        </IconButton>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Apply button */}
            {latest.suggestions.some((s) => s.status === 'approved') && (
              <div className="mt-[var(--spacing-lg)] flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--success)]/30 bg-[var(--success)]/5 p-[var(--spacing-md)]">
                <div>
                  <p className="text-sm font-semibold text-[var(--success)]">
                    Sugerencias aprobadas listas para aplicar
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Al aplicar, se regenerará contenido según los ajustes aprobados.
                  </p>
                </div>
                <Button
                  onClick={() => applyMutation.mutate(latest.id)}
                  loading={applyMutation.isPending}
                  className="gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  Aplicar ajustes
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}