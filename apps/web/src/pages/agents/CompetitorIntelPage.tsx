import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Crosshair, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import { listCompetitorAnalyses, triggerCompetitorAnalysis, getCompetitorAnalysis } from '@/services/agents';
import { ApiError } from '@/services/api';

export default function CompetitorIntelPage() {
  const queryClient = useQueryClient();
  const [pollId, setPollId] = useState<string | null>(null);

  const analysesQuery = useQuery({
    queryKey: ['competitor-analyses'],
    queryFn: listCompetitorAnalyses,
  });

  const activeAnalysis = analysesQuery.data?.find(
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

  const latestAnalysis = (() => {
    if (pollQuery.data?.status === 'completed' || pollQuery.data?.status === 'failed') {
      return pollQuery.data;
    }
    return analysesQuery.data?.find((a) => a.status === 'completed') ?? null;
  })();

  const latestFailed = analysesQuery.data?.find((a) => a.status === 'failed');

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

      {/* Trigger card */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20">
            <Crosshair className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-[var(--foreground)]">Analizar competidores</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              Usa los competidores registrados en tu perfil de empresa.
            </p>
          </div>
          <Button
            onClick={() => triggerMutation.mutate()}
            loading={triggerMutation.isPending}
            disabled={!!activeAnalysis}
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
                Iniciar análisis
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Active analysis indicator */}
      {activeAnalysis && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-3 text-sm text-amber-800">
            <Loader2 className="h-5 w-5 animate-spin" />
            Analizando competidores... esto puede tomar unos segundos.
          </div>
        </Card>
      )}

      {/* Last failed */}
      {!activeAnalysis && latestFailed && !latestAnalysis && (
        <Card className="mb-6 border-red-200 bg-red-50/50">
          <div className="text-sm text-red-700">
            <p className="font-semibold">Error en el último análisis</p>
            <p className="mt-1">{latestFailed.errorMessage}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => triggerMutation.mutate()}
            >
              Reintentar
            </Button>
          </div>
        </Card>
      )}

      {/* Analysis result */}
      {latestAnalysis && latestAnalysis.analysis && (
        <Card
          title="Reporte de análisis competitivo"
          subtitle="Generado por IA"
        >
          <pre className="max-h-[70vh] overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-[var(--background-secondary)] p-4 text-xs leading-relaxed text-[var(--foreground-muted)]">
            {JSON.stringify(latestAnalysis.analysis, null, 2)}
          </pre>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-[var(--foreground-subtle)]">
              Última actualización:{' '}
              {new Date(latestAnalysis.updatedAt).toLocaleString('es-MX')}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => triggerMutation.mutate()}
              disabled={!!activeAnalysis}
            >
              <RefreshCw className="h-4 w-4" />
              Re-analizar
            </Button>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!analysesQuery.isLoading &&
        !analysesQuery.data?.length && (
        <Card>
          <div className="py-12 text-center text-sm text-[var(--foreground-muted)]">
            Aún no hay análisis. Asegúrate de tener competidores registrados en tu perfil de empresa
            y haz clic en "Iniciar análisis".
          </div>
        </Card>
      )}
    </DashboardShell>
  );
}