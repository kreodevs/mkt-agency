import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { toast } from '@/components/molecules/Sonner';
import {
  listAgentEvents,
  getAgencyPerformance,
  getAgencyAnomalies,
  getAgencyAttribution,
  getExecutiveReport,
  generateExecutiveReport,
} from '@/services/operating-profile';
import { useResolvedProductId } from '@/hooks/useResolvedProductId';
import { useOperatingProfile } from '@/hooks/useOperatingProfile';
import { getAgentEventNavigation } from '@/lib/agent-event-navigation';

export default function AgencyActivityPage() {
  const productId = useResolvedProductId();
  const { isSoho } = useOperatingProfile();
  const queryClient = useQueryClient();
  const [attributionModel, setAttributionModel] = useState<'first_touch' | 'last_touch'>(
    'last_touch',
  );

  const eventsQuery = useQuery({
    queryKey: ['agency-events', productId],
    queryFn: () => listAgentEvents({ productId: productId ?? undefined, limit: 30 }),
  });

  const performanceQuery = useQuery({
    queryKey: ['agency-performance', productId],
    queryFn: () => getAgencyPerformance(productId ?? undefined),
  });

  const anomaliesQuery = useQuery({
    queryKey: ['agency-anomalies', productId],
    queryFn: () => getAgencyAnomalies(productId ?? undefined),
  });

  const attributionQuery = useQuery({
    queryKey: ['agency-attribution', productId, attributionModel],
    queryFn: () =>
      getAgencyAttribution({
        productId: productId ?? undefined,
        model: attributionModel,
      }),
  });

  const executiveReportQuery = useQuery({
    queryKey: ['executive-report', productId],
    queryFn: () => getExecutiveReport(productId ?? undefined),
  });

  const generateReportMutation = useMutation({
    mutationFn: () => generateExecutiveReport(productId ?? undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['executive-report'] });
      void queryClient.invalidateQueries({ queryKey: ['agency-events'] });
      toast.success('Reporte ejecutivo generado');
    },
    onError: () => toast.error('No se pudo generar el reporte'),
  });

  return (
    <DashboardShell>
      <PageHeader
        eyebrow={isSoho ? 'Copiloto SOHO' : 'Growth'}
        title="Actividad de agentes"
        description={
          isSoho
            ? 'Trazabilidad del copiloto: estrategia de contenido → creativo → bandeja'
            : 'Eventos del ciclo cerrado entre agentes de la agencia'
        }
      />

      <Card
        title="Reporte ejecutivo semanal"
        subtitle="Leads + pauta CSV — sugerencias para tu aprobación (sin auto-ejecución)"
        className="mb-6"
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={generateReportMutation.isPending}
            onClick={() => generateReportMutation.mutate()}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${generateReportMutation.isPending ? 'animate-spin' : ''}`}
            />
            Generar ahora
          </Button>
          {executiveReportQuery.data?.generatedAt && (
            <span className="text-xs text-[var(--foreground-muted)]">
              Último: {new Date(executiveReportQuery.data.generatedAt).toLocaleString('es-MX')}
            </span>
          )}
        </div>
        {executiveReportQuery.isLoading && (
          <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
        )}
        {!executiveReportQuery.data && !executiveReportQuery.isLoading && (
          <p className="text-sm text-[var(--foreground-muted)]">
            Aún no hay reporte. Se genera automáticamente los lunes o puedes forzarlo arriba.
          </p>
        )}
        {executiveReportQuery.data && (
          <div className="space-y-3 text-sm">
            <p className="font-medium">{executiveReportQuery.data.headline}</p>
            <p className="text-[var(--foreground-muted)]">
              {executiveReportQuery.data.executiveSummary}
            </p>
            {executiveReportQuery.data.paidMediaInsight && (
              <p className="text-xs text-[var(--foreground-muted)]">
                Pauta: {executiveReportQuery.data.paidMediaInsight}
              </p>
            )}
            {executiveReportQuery.data.suggestions.length > 0 && (
              <ul className="space-y-2">
                {executiveReportQuery.data.suggestions.map((item) => (
                  <li key={item.id} className="rounded border border-[var(--border)] p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill
                        status={
                          item.priority === 'high'
                            ? 'warning'
                            : item.priority === 'medium'
                              ? 'info'
                              : 'neutral'
                        }
                      >
                        {item.priority}
                      </StatusPill>
                      <span className="text-xs text-[var(--foreground-muted)]">
                        Requiere tu firma
                      </span>
                    </div>
                    <p className="mt-1 font-medium">{item.action}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">{item.rationale}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Eventos recientes">
          {eventsQuery.isLoading && (
            <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
          )}
          <ul className="max-h-[420px] space-y-2 overflow-y-auto">
            {(eventsQuery.data ?? []).map((event) => {
              const destination = getAgentEventNavigation(event.eventType, isSoho);
              return (
              <li
                key={event.id}
                className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={event.status === 'skipped' ? 'neutral' : 'info'}>
                    {event.eventType}
                  </StatusPill>
                  <span className="text-xs text-[var(--foreground-muted)]">
                    {event.sourceAgent}
                    {event.targetAgent ? ` → ${event.targetAgent}` : ''}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                  {destination && (
                    <Link
                      to={destination.href}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
                    >
                      {destination.label}
                      <ArrowRight className="h-3 w-3" aria-hidden />
                    </Link>
                  )}
                </div>
              </li>
            );
            })}
            {(eventsQuery.data ?? []).length === 0 && !eventsQuery.isLoading && (
              <p className="text-sm text-[var(--foreground-muted)]">
                Prepara una semana en Inicio para ver actividad.
              </p>
            )}
          </ul>
        </Card>

        <Card title="Leads (Analytics lite)" subtitle="Últimos 30 días">
          <p className="mb-3 text-xs">
            <Link to="/agency/performance" className="text-[var(--primary)] hover:underline">
              Importar CSV de pauta y ver CPL estimado →
            </Link>
          </p>
          {performanceQuery.isLoading && (
            <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
          )}
          {performanceQuery.data && (
            <div className="space-y-3 text-sm">
              <p>
                Total leads: <strong>{performanceQuery.data.totalLeads}</strong>
              </p>
              {performanceQuery.data.bySource.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[var(--foreground-muted)]">Por fuente</p>
                  <ul className="mt-1 space-y-1">
                    {performanceQuery.data.bySource.map((row) => (
                      <li key={row.source}>
                        {row.source}: {row.count}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card title="Alertas (Analytics)" subtitle="Comparativa semanal de leads">
          {anomaliesQuery.isLoading && (
            <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
          )}
          {(anomaliesQuery.data ?? []).length === 0 && !anomaliesQuery.isLoading && (
            <p className="text-sm text-[var(--foreground-muted)]">Sin anomalías detectadas.</p>
          )}
          <ul className="space-y-2 text-sm">
            {(anomaliesQuery.data ?? []).map((alert, i) => (
              <li key={i} className="rounded border border-[var(--border)] p-2">
                <StatusPill status={alert.severity === 'critical' ? 'error' : 'warning'}>
                  {alert.type}
                </StatusPill>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">{alert.recommendation}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Atribución MTA lite" subtitle="Últimos 30 días">
          <div className="mb-3 flex gap-2 text-xs">
            <button
              type="button"
              className={`rounded px-2 py-1 ${attributionModel === 'last_touch' ? 'bg-[var(--primary)] text-white' : 'border border-[var(--border)]'}`}
              onClick={() => setAttributionModel('last_touch')}
            >
              Last touch
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 ${attributionModel === 'first_touch' ? 'bg-[var(--primary)] text-white' : 'border border-[var(--border)]'}`}
              onClick={() => setAttributionModel('first_touch')}
            >
              First touch
            </button>
          </div>
          {attributionQuery.isLoading && (
            <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
          )}
          {attributionQuery.data && (
            <ul className="space-y-1 text-sm">
              {attributionQuery.data.byChannel.map((row) => (
                <li key={row.channel} className="flex justify-between">
                  <span>{row.channel}</span>
                  <span>
                    {row.count} ({row.share}%)
                  </span>
                </li>
              ))}
              {attributionQuery.data.byChannel.length === 0 && (
                <p className="text-[var(--foreground-muted)]">Sin leads en el periodo.</p>
              )}
            </ul>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
