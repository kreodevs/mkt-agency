import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BarChart3,
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
import { Button } from '@/components/atoms/Button';
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
  adjust_content: { label: 'Ajustar contenido', class: 'bg-blue-500/10 text-blue-600' },
  reallocate_budget: { label: 'Reasignar presupuesto', class: 'bg-amber-500/10 text-amber-600' },
  change_strategy: { label: 'Cambiar estrategia', class: 'bg-violet-500/10 text-violet-600' },
  pause_channel: { label: 'Pausar canal', class: 'bg-red-500/10 text-red-600' },
  amplify: { label: 'Amplificar', class: 'bg-emerald-500/10 text-emerald-600' },
};

const HEALTH_CONFIG: Record<string, { icon: typeof TrendingUp; label: string; color: string }> = {
  good: { icon: TrendingUp, label: 'Bueno', color: 'text-emerald-500' },
  fair: { icon: BarChart3, label: 'Estable', color: 'text-amber-500' },
  poor: { icon: TrendingDown, label: 'Crítico', color: 'text-red-500' },
};

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
        title="Ajuste de estrategia"
        description="Analiza el rendimiento y ajusta tu estrategia de contenido"
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
            <XCircle className="h-10 w-10 text-red-500" />
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
        <div className="space-y-6">
          {/* Health summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HealthCard
              icon={TrendingUp}
              label="Rendimiento general"
              value={
                HEALTH_CONFIG[latest.data.overallHealth ?? 'fair']?.label ?? 'Estable'
              }
              color={
                HEALTH_CONFIG[latest.data.overallHealth ?? 'fair']?.color ?? 'text-amber-500'
              }
            />
            <HealthCard
              icon={ThumbsUp}
              label="Funciona"
              value={latest.data.topPerforming?.length ?? 0}
              color="text-emerald-500"
            />
            <HealthCard
              icon={AlertCircle}
              label="No funciona"
              value={latest.data.underperforming?.length ?? 0}
              color="text-red-500"
            />
            <HealthCard
              icon={Lightbulb}
              label="Sugerencias"
              value={latest.suggestions.length}
              color="text-violet-500"
              indented={
                latest.suggestions.filter((s) => s.status === 'approved').length > 0
                  ? `${latest.suggestions.filter((s) => s.status === 'approved').length} aprobadas`
                  : undefined
              }
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
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-500">
                    <TrendingUp className="h-4 w-4" />
                    Lo que funciona
                  </p>
                  <ul className="space-y-1.5">
                    {latest.data.topPerforming.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latest.data.underperforming && latest.data.underperforming.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-500">
                    <TrendingDown className="h-4 w-4" />
                    Lo que no funciona
                  </p>
                  <ul className="space-y-1.5">
                    {latest.data.underperforming.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
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
                  className={`rounded-xl border p-4 transition-all ${
                    suggestion.status === 'approved'
                      ? 'border-emerald-400 bg-emerald-500/5'
                      : suggestion.status === 'rejected'
                        ? 'border-red-400 bg-red-500/5'
                        : suggestion.status === 'applied'
                          ? 'border-emerald-600 bg-emerald-500/10'
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
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            ACTION_TYPE_BADGES[suggestion.actionType]?.class ??
                            'bg-[var(--secondary)] text-[var(--foreground-muted)]'
                          }`}
                        >
                          {ACTION_TYPE_BADGES[suggestion.actionType]?.label ??
                            suggestion.actionType}
                        </span>
                        {suggestion.status === 'approved' && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                            <CheckCircle2 className="h-3 w-3" />
                            Aprobada
                          </span>
                        )}
                        {suggestion.status === 'rejected' && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-red-500">
                            <XCircle className="h-3 w-3" />
                            Rechazada
                          </span>
                        )}
                        {suggestion.status === 'applied' && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
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
                          <p className="text-xs font-medium text-emerald-500">
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
              <div className="mt-6 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-600">
                    Sugerencias aprobadas listas para aplicar
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Al aplicar, se regenerará contenido según los ajustes aprobados.
                  </p>
                </div>
                <Button
                  onClick={() => applyMutation.mutate(latest.id)}
                  loading={applyMutation.isPending}
                  className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
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

function HealthCard({
  icon: Icon,
  label,
  value,
  color,
  indented,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  indented?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:shadow-md">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)]`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          {label}
        </p>
        <p className={`mt-0.5 text-2xl font-black ${color}`}>{value}</p>
        {indented && (
          <p className="mt-0.5 text-[10px] font-medium text-[var(--foreground-muted)]">
            {indented}
          </p>
        )}
      </div>
    </div>
  );
}