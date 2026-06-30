import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Crosshair, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { CompetitorIntelHistory } from '@/components/agents/CompetitorIntelHistory';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import { listCompetitorAnalyses, triggerCompetitorAnalysis, getCompetitorAnalysis } from '@/services/agents';
import { listCompetitors } from '@/services/competitors';
import { ApiError } from '@/services/api';
import { CompetitorDiscoveryPanel } from '@/components/competitors/CompetitorDiscoveryPanel';

export default function CompetitorIntelPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [pollId, setPollId] = useState<string | null>(null);
  const selectedAnalysisId = searchParams.get('analysis');

  const analysesQuery = useQuery({
    queryKey: ['competitor-analyses'],
    queryFn: listCompetitorAnalyses,
  });

  const competitorsQuery = useQuery({
    queryKey: ['competitors'],
    queryFn: listCompetitors,
  });

  const analyses = analysesQuery.data ?? [];
  const hasCompetitors = (competitorsQuery.data?.items.length ?? 0) > 0;

  const activeAnalysis = analyses.find(
    (a) => a.status === 'pending' || a.status === 'processing',
  );

  const pollQuery = useQuery({
    queryKey: ['competitor-analysis-poll', pollId],
    queryFn: () => getCompetitorAnalysis(pollId!),
    enabled: !!pollId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      return data.status === 'pending' || data.status === 'processing' ? 3000 : false;
    },
  });

  useEffect(() => {
    if (!pollQuery.data) return;
    if (pollQuery.data.status === 'completed' || pollQuery.data.status === 'failed') {
      setPollId(null);
      queryClient.invalidateQueries({ queryKey: ['competitor-analyses'] });
    }
  }, [pollQuery.data, queryClient]);

  const triggerMutation = useMutation({
    mutationFn: () => triggerCompetitorAnalysis(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['competitor-analyses'] });
      setPollId(result.id);
      toast.success('Análisis de competidores iniciado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al iniciar análisis');
    },
  });

  const selectedAnalysis = useMemo(() => {
    if (pollQuery.data && (pollId || selectedAnalysisId === pollQuery.data.id)) {
      return pollQuery.data;
    }
    if (selectedAnalysisId) {
      return analyses.find((item) => item.id === selectedAnalysisId) ?? null;
    }
    return analyses.find((item) => item.status === 'completed') ?? null;
  }, [analyses, pollQuery.data, pollId, selectedAnalysisId]);

  const latestFailed = analyses.find((a) => a.status === 'failed');

  return (
    <DashboardShell navigationOverride={tenantNavigation}>
      <PageHeader
        title="Competitor Intel"
        description="Análisis profundo de tus competidores: fortalezas, debilidades y oportunidades de mercado."
        actions={
          <Link to="/agents">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ChevronLeft className="h-4 w-4" />
              Agentes
            </Button>
          </Link>
        }
      />

      <div className="mx-auto max-w-3xl space-y-6">
        {!analysesQuery.isLoading && analyses.length > 0 && (
          <CompetitorIntelHistory analyses={analyses} selectedId={selectedAnalysis?.id} />
        )}

        {activeAnalysis && (
          <Card className="border-amber-200 bg-amber-50/50">
            <div className="flex items-center gap-3 text-sm text-amber-800">
              <Loader2 className="h-5 w-5 animate-spin" />
              Analizando competidores... esto puede tomar unos segundos.
            </div>
          </Card>
        )}

        {!activeAnalysis && latestFailed && !selectedAnalysis?.analysis && (
          <Card className="border-red-200 bg-red-50/50">
            <div className="text-sm text-red-700">
              <p className="font-semibold">Error en el último análisis</p>
              <p className="mt-1">{latestFailed.errorMessage}</p>
            </div>
          </Card>
        )}

        {selectedAnalysis?.analysis && (
          <Card title="Reporte de análisis competitivo" subtitle="Generado por IA">
            <pre className="max-h-[70vh] overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-[var(--background-secondary)] p-4 text-xs leading-relaxed text-[var(--foreground-muted)]">
              {JSON.stringify(selectedAnalysis.analysis, null, 2)}
            </pre>
            <p className="mt-4 text-xs text-[var(--foreground-subtle)]">
              Actualizado:{' '}
              {new Date(selectedAnalysis.updatedAt).toLocaleString('es-MX')}
            </p>
          </Card>
        )}

        {!analysesQuery.isLoading && analyses.length === 0 && !hasCompetitors && (
          <Card>
            <div className="py-6 text-center text-sm text-[var(--foreground-muted)]">
              Aún no hay análisis ni competidores registrados. Usa la búsqueda con IA abajo para
              empezar.
            </div>
          </Card>
        )}

        {!hasCompetitors && (
          <CompetitorDiscoveryPanel
            subtitle="Sin competidores registrados. Elige alcance global, por país o por ciudad."
            onRegistered={() => {
              void queryClient.invalidateQueries({ queryKey: ['competitors'] });
            }}
          />
        )}

        {!analysesQuery.isLoading && analyses.length === 0 && hasCompetitors && (
          <Card>
            <div className="py-12 text-center text-sm text-[var(--foreground-muted)]">
              Ya tienes competidores registrados. Inicia el primer reporte abajo.
            </div>
          </Card>
        )}

        <Card title={analyses.length > 0 ? 'Nuevo análisis' : 'Primer análisis'}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20">
                <Crosshair className="h-6 w-6 text-amber-600" />
              </div>
              <p className="text-sm text-[var(--foreground-muted)]">
                {hasCompetitors
                  ? 'Analiza los competidores registrados y genera un reporte estratégico con IA.'
                  : 'Registra competidores (manual o con IA arriba) para habilitar el análisis.'}
              </p>
            </div>
            <Button
              onClick={() => triggerMutation.mutate()}
              loading={triggerMutation.isPending}
              disabled={!!activeAnalysis || !hasCompetitors}
              className="gap-2 shrink-0"
            >
              {activeAnalysis ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {analyses.length > 0 ? 'Lanzar nuevo análisis' : 'Iniciar análisis'}
                </>
              )}
            </Button>
          </div>
          {selectedAnalysis?.analysis && (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => triggerMutation.mutate()}
                disabled={!!activeAnalysis}
              >
                <RefreshCw className="h-4 w-4" />
                Re-analizar con datos actuales
              </Button>
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
