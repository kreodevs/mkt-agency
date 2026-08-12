import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Crosshair, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { CompetitorAnalysisReport } from '@/components/agents/CompetitorAnalysisReport';
import { CompetitorIntelHistory } from '@/components/agents/CompetitorIntelHistory';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import { listCompetitorAnalyses, triggerCompetitorAnalysis, getCompetitorAnalysis } from '@/services/agents';
import { listCompetitors } from '@/services/competitors';
import { ApiError } from '@/services/api';
import { CompetitorDiscoveryPanel } from '@/components/competitors/CompetitorDiscoveryPanel';
import { ProductContextBanner } from '@/components/products/ProductContextBanner';
import { useResolvedProductId } from '@/hooks/useResolvedProductId';
import { useOperatingProfile } from '@/hooks/useOperatingProfile';
import { withActiveProductQuery } from '@/store/active-product';
import { isImpersonating } from '@/lib/impersonation';

export default function CompetitorIntelPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [pollId, setPollId] = useState<string | null>(null);
  const selectedAnalysisId = searchParams.get('analysis');
  const resolvedProductId = useResolvedProductId();
  const { isSoho } = useOperatingProfile();
  const copilotMode = isSoho || isImpersonating();
  const withProduct = (href: string) => withActiveProductQuery(href);

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
    <DashboardShell>
      <PageHeader
        eyebrow={copilotMode ? 'Copiloto SOHO' : 'Agente IA'}
        title="Análisis de competidores"
        description={
          copilotMode
            ? 'Descubre rivales, analiza el mercado y alimenta el copy de tu semana — tú apruebas cada publicación.'
            : 'Análisis profundo de tus competidores: fortalezas, debilidades y oportunidades de mercado.'
        }
        actions={
          <Link to={withProduct(copilotMode ? '/' : '/agents')}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ChevronLeft className="h-4 w-4" />
              {copilotMode ? 'Bandeja' : 'Agentes'}
            </Button>
          </Link>
        }
      />

      {resolvedProductId && <ProductContextBanner productId={resolvedProductId} />}

      <div className="mx-auto max-w-3xl space-y-6">
        {!analysesQuery.isLoading && analyses.length > 0 && (
          <CompetitorIntelHistory analyses={analyses} selectedId={selectedAnalysis?.id} />
        )}

        {activeAnalysis && (
          <Card className="border-[var(--warning)]/30 bg-[var(--warning)]/5">
            <div className="flex items-center gap-[var(--spacing-md)] text-sm text-[var(--warning)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              Analizando competidores... esto puede tomar unos segundos.
            </div>
          </Card>
        )}

        {!activeAnalysis && latestFailed && !selectedAnalysis?.analysis && (
          <Card className="border-[var(--destructive)]/30 bg-[var(--destructive)]/5">
            <div className="text-sm text-[var(--destructive)]">
              <p className="font-semibold">Error en el último análisis</p>
              <p className="mt-1">{latestFailed.errorMessage}</p>
            </div>
          </Card>
        )}

        {selectedAnalysis?.analysis && (
          <Card title="Reporte de análisis competitivo" subtitle="Generado por IA">
            <CompetitorAnalysisReport analysis={selectedAnalysis.analysis} />
            <p className="px-[var(--spacing-md)] pb-[var(--spacing-md)] text-xs text-[var(--foreground-subtle)]">
              Actualizado:{' '}
              {new Date(selectedAnalysis.updatedAt).toLocaleString('es-MX')}
            </p>
          </Card>
        )}

        {!analysesQuery.isLoading && analyses.length === 0 && !hasCompetitors && (
          <EmptyState
            icon={Crosshair}
            title="Sin competidores ni análisis"
            description="Usa la búsqueda con IA abajo para descubrir y registrar competidores."
          />
        )}

        {!hasCompetitors && (
          <CompetitorDiscoveryPanel
            defaultProductId={resolvedProductId}
            subtitle="Sin competidores registrados. Elige alcance global, por país o por ciudad."
            onRegistered={() => {
              void queryClient.invalidateQueries({ queryKey: ['competitors'] });
            }}
          />
        )}

        {!analysesQuery.isLoading && analyses.length === 0 && hasCompetitors && (
          <EmptyState
            compact
            icon={Sparkles}
            title="Listo para el primer reporte"
            description="Ya tienes competidores registrados. Inicia el análisis abajo."
          />
        )}

        <Card variant="accent" title={analyses.length > 0 ? 'Nuevo análisis' : 'Primer análisis'}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--warning)]/20 bg-[var(--warning)]/10">
                <Crosshair className="h-6 w-6 text-[var(--warning)]" />
              </div>
              <p className="text-sm text-[var(--foreground-muted)]">
                {hasCompetitors
                  ? 'Analiza los competidores registrados y genera un reporte estratégico con IA.'
                  : 'Registra competidores (manual o con IA arriba) para habilitar el análisis.'}
              </p>
            </div>
            <Button
              variant="brand"
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
