import { useQuery } from '@tanstack/react-query';
import { Crosshair, FileText, Target, TrendingUp, Users } from 'lucide-react';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Progress } from '@/components/molecules/Progress';
import { apiFetch } from '@/services/api';

interface MetricsResponse {
  leads: {
    total: number;
    byStage: Record<string, number>;
    conversionRate: number;
  };
  content: {
    total: number;
    byStatus: Record<string, number>;
    approvalRate: number;
  };
  campaigns: {
    total: number;
  };
}

const STAGE_LABELS: Record<string, string> = {
  prospect: 'Prospectos',
  contacted: 'Contactados',
  interested: 'Interesados',
  trial: 'En prueba',
  client: 'Clientes',
};

const STAGE_COLORS: Record<string, string> = {
  prospect: 'bg-slate-400',
  contacted: 'bg-blue-400',
  interested: 'bg-amber-400',
  trial: 'bg-violet-400',
  client: 'bg-emerald-400',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borradores',
  pending: 'Pendientes',
  approved: 'Aprobados',
  rejected: 'Rechazados',
};

export default function MetricsDashboardPage() {
  const metricsQuery = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => apiFetch<MetricsResponse>('/dashboard/metrics'),
  });

  const data = metricsQuery.data;

  return (
    <DashboardShell navigationOverride={tenantNavigation}>
      <PageHeader
        title="Panel de métricas"
        description="Resumen visual del rendimiento de tu agencia"
      />

      {metricsQuery.isLoading ? (
        <div className="py-20 text-center text-[var(--foreground-muted)]">
          Cargando métricas...
        </div>
      ) : !data ? (
        <div className="py-20 text-center text-[var(--foreground-muted)]">
          No hay datos suficientes para mostrar métricas.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Row 1: Big KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={Users}
              label="Total leads"
              value={data.leads.total}
              color="text-blue-600"
              bg="bg-blue-500/10"
            />
            <KpiCard
              icon={TrendingUp}
              label="Tasa conversión"
              value={`${data.leads.conversionRate}%`}
              color="text-emerald-600"
              bg="bg-emerald-500/10"
            />
            <KpiCard
              icon={FileText}
              label="Contenidos"
              value={data.content.total}
              color="text-violet-600"
              bg="bg-violet-500/10"
            />
            <KpiCard
              icon={Target}
              label="Campañas"
              value={data.campaigns.total}
              color="text-amber-600"
              bg="bg-amber-500/10"
            />
          </div>

          {/* Row 2: Lead funnel + Content status */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Lead funnel */}
            <Card title="Embudo de leads" subtitle="Distribución por etapa">
              <div className="space-y-4">
                {Object.entries(STAGE_LABELS).map(([stage, label]) => {
                  const count = data.leads.byStage[stage] ?? 0;
                  const pct = data.leads.total > 0
                    ? Math.round((count / data.leads.total) * 100)
                    : 0;
                  return (
                    <div key={stage}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-[var(--foreground)]">{label}</span>
                        <span className="font-semibold text-[var(--foreground-muted)]">
                          {count} <span className="text-xs">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--secondary)]">
                        <div
                          className={`h-full rounded-full transition-all ${STAGE_COLORS[stage] ?? 'bg-slate-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--foreground-subtle)]">
                <Crosshair className="h-3 w-3" />
                Meta: convertir prospectos en clientes
              </div>
            </Card>

            {/* Content status */}
            <Card title="Estado del contenido" subtitle="Aprobación vs pendiente">
              <div className="mb-6 flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-4xl font-black text-emerald-500">
                    {data.content.approvalRate}%
                  </p>
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">Aprobado</p>
                </div>
                <div className="h-16 w-px bg-[var(--border)]" />
                <div className="text-center">
                  <p className="text-4xl font-black text-amber-500">
                    {100 - data.content.approvalRate}%
                  </p>
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">Pendiente</p>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(STATUS_LABELS).map(([status, label]) => {
                  const count = data.content.byStatus[status] ?? 0;
                  return (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--foreground)]">{label}</span>
                      <span className="font-semibold text-[var(--foreground-muted)]">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Row 3: Conversion rate progress */}
          <Card title="Rendimiento general" subtitle="Indicadores clave">
            <div className="space-y-5">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--foreground)]">Tasa de conversión</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {data.leads.conversionRate}%
                  </span>
                </div>
                <Progress value={data.leads.conversionRate} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--foreground)]">Tasa de aprobación</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {data.content.approvalRate}%
                  </span>
                </div>
                <Progress value={data.content.approvalRate} />
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:shadow-md">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-black text-[var(--foreground)]">{value}</p>
      </div>
    </div>
  );
}