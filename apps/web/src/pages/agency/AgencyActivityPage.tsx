import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { StatusPill } from '@/components/atoms/StatusPill';
import { listAgentEvents, getAgencyPerformance, getAgencyAnomalies } from '@/services/operating-profile';
import { useResolvedProductId } from '@/hooks/useResolvedProductId';
import { useOperatingProfile } from '@/hooks/useOperatingProfile';

export default function AgencyActivityPage() {
  const productId = useResolvedProductId();
  const { isSoho } = useOperatingProfile();

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

  return (
    <DashboardShell>
      <PageHeader
        title="Actividad de agentes"
        description={
          isSoho
            ? 'Trazabilidad del copiloto: estrategia de contenido → creativo → bandeja'
            : 'Eventos del ciclo cerrado entre agentes de la agencia'
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Eventos recientes">
          {eventsQuery.isLoading && (
            <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
          )}
          <ul className="max-h-[420px] space-y-2 overflow-y-auto">
            {(eventsQuery.data ?? []).map((event) => (
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
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
            {(eventsQuery.data ?? []).length === 0 && !eventsQuery.isLoading && (
              <p className="text-sm text-[var(--foreground-muted)]">
                Prepara una semana en Inicio para ver actividad.
              </p>
            )}
          </ul>
        </Card>

        <Card title="Leads (Analytics lite)" subtitle="Últimos 30 días">
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
      </div>
    </DashboardShell>
  );
}
