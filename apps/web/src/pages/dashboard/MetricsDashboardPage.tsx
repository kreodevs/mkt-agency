import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
} from 'recharts';
import {
  Crosshair,
  FileText,
  Target,
  TrendingUp,
  Users,
  Activity,
} from 'lucide-react';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { Card } from '@/components/molecules/Card';
import { StatsCard } from '@/components/molecules/StatsCard';
import { PageHeader } from '@/components/molecules/PageHeader';
import { apiFetch } from '@/services/api';

interface MetricsResponse {
  leads: {
    total: number;
    byStage: Record<string, number>;
    conversionRate: number;
    funnel: Array<{ stage: string; label: string; value: number }>;
  };
  content: {
    total: number;
    byStatus: Record<string, number>;
    approvalRate: number;
    trend: Array<{ month: string; count: number }>;
  };
  campaigns: {
    total: number;
    byStatus: Record<string, number>;
    active: number;
  };
}

const FUNNEL_COLORS = ['#94a3b8', '#60a5fa', '#f59e0b', '#a78bfa', '#34d399'];
const PIE_COLORS: Record<string, string> = {
  approved: '#34d399',
  pending: '#f59e0b',
  draft: '#94a3b8',
  rejected: '#ef4444',
};
const PIE_LABELS: Record<string, string> = {
  approved: 'Aprobados',
  pending: 'Pendientes',
  draft: 'Borradores',
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
        <div className="space-y-[var(--spacing-lg)]">
          <div className="grid gap-[var(--spacing-md)] sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total leads"
              value={data.leads.total}
              icon={<Users className="h-5 w-5" aria-hidden />}
              iconTone="primary"
            />
            <StatsCard
              title="Tasa conversión"
              value={`${data.leads.conversionRate}%`}
              description={
                data.leads.conversionRate >= 20
                  ? '¡Funciona!'
                  : data.leads.conversionRate >= 10
                    ? 'Estable'
                    : 'Mejorable'
              }
              icon={<TrendingUp className="h-5 w-5" aria-hidden />}
              iconTone={
                data.leads.conversionRate >= 20
                  ? 'success'
                  : data.leads.conversionRate >= 10
                    ? 'warning'
                    : 'warning'
              }
            />
            <StatsCard
              title="Contenidos"
              value={data.content.total}
              icon={<FileText className="h-5 w-5" aria-hidden />}
              iconTone="accent"
            />
            <StatsCard
              title="Campañas activas"
              value={`${data.campaigns.active}/${data.campaigns.total}`}
              description={
                data.campaigns.active > 0
                  ? `${data.campaigns.active} en curso`
                  : 'Sin campañas activas'
              }
              icon={<Target className="h-5 w-5" aria-hidden />}
              iconTone={data.campaigns.active > 0 ? 'success' : 'warning'}
            />
          </div>

          {/* Row 2: Funnel + Content Pie */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Lead funnel chart */}
            <Card title="Embudo de leads" subtitle="De prospecto a cliente">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--foreground)',
                      }}
                    />
                    <Funnel
                      dataKey="value"
                      data={data.leads.funnel.filter((f) => f.value > 0)}
                      isAnimationActive
                    >
                      <LabelList
                        dataKey="label"
                        position="right"
                        fill="var(--foreground)"
                        stroke="none"
                        fontSize={12}
                      />
                      {data.leads.funnel
                        .filter((f) => f.value > 0)
                        .map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={FUNNEL_COLORS[idx]} />
                        ))}
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center gap-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--foreground-subtle)]">
                <Crosshair className="h-3 w-3 shrink-0" />
                <span>
                  {data.leads.conversionRate >= 20
                    ? 'El embudo está funcionando bien — buena tasa de conversión a cliente.'
                    : data.leads.conversionRate >= 10
                      ? 'Embudo con rendimiento estable. Busca optimizar etapas intermedias.'
                      : 'Embudo con baja conversión. Revisa las etapas de contacto e interés.'}
                </span>
              </div>
            </Card>

            {/* Content approval donut */}
            <Card title="Estado del contenido" subtitle="Aprobación vs pendiente">
              <div className="flex items-center justify-center gap-6">
                <div className="h-52 w-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(data.content.byStatus)
                          .filter(([, v]) => v > 0)
                          .map(([status, count]) => ({
                            name: PIE_LABELS[status] ?? status,
                            value: count,
                            color: PIE_COLORS[status] ?? '#94a3b8',
                          }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {Object.entries(data.content.byStatus)
                          .filter(([, v]) => v > 0)
                          .map(([status]) => (
                            <Cell
                              key={status}
                              fill={PIE_COLORS[status] ?? '#94a3b8'}
                            />
                          ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          color: 'var(--foreground)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {Object.entries(data.content.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[status] ?? '#94a3b8' }}
                      />
                      <span className="text-[var(--foreground)]">
                        {PIE_LABELS[status] ?? status}
                      </span>
                      <span className="ml-auto font-semibold text-[var(--foreground-muted)]">
                        {count}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 border-t border-[var(--border)] pt-2 text-sm font-medium text-[var(--success)]">
                    <Activity className="h-3.5 w-3.5" />
                    <span>{data.content.approvalRate}% aprobado</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Row 3: Trend chart + Performance indicators */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Content trend */}
            <Card
              title="Contenido creado"
              subtitle="Últimos 12 meses"
            >
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.content.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: 'var(--foreground-muted)', fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: 'var(--foreground-muted)', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--foreground)',
                      }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Performance summary - this is working / this isn't */}
            <Card title="¿Qué está funcionando?" subtitle="Diagnóstico automático">
              <div className="space-y-4">
                {/* Conversion rate gauge */}
                <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)]">
                  <div className="mb-[var(--spacing-sm)] flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      Tasa de conversión
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        data.leads.conversionRate >= 20
                          ? 'text-[var(--success)]'
                          : data.leads.conversionRate >= 10
                            ? 'text-[var(--warning)]'
                            : 'text-[var(--destructive)]'
                      }`}
                    >
                      {data.leads.conversionRate >= 20
                        ? '✅ Funciona'
                        : data.leads.conversionRate >= 10
                          ? '⚠️ Estable'
                          : '❌ No funciona'}
                    </span>
                  </div>
                  <div className="mb-1 h-2 overflow-hidden rounded-full bg-[var(--secondary)]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        data.leads.conversionRate >= 20
                          ? 'bg-[var(--success)]'
                          : data.leads.conversionRate >= 10
                            ? 'bg-[var(--warning)]'
                            : 'bg-[var(--destructive)]'
                      }`}
                      style={{ width: `${Math.min(data.leads.conversionRate, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--foreground-subtle)]">
                    {data.leads.conversionRate >= 20
                      ? 'Los leads están convirtiendo bien. Satura los canales que funcionan.'
                      : data.leads.conversionRate >= 10
                        ? 'Conversión aceptable. Prueba nuevos enfoques en etapas intermedias.'
                        : 'Baja conversión. Revisa la calidad de leads y el proceso de seguimiento.'}
                  </p>
                </div>

                {/* Approval rate */}
                <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)]">
                  <div className="mb-[var(--spacing-sm)] flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      Tasa de aprobación
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        data.content.approvalRate >= 70
                          ? 'text-[var(--success)]'
                          : data.content.approvalRate >= 40
                            ? 'text-[var(--warning)]'
                            : 'text-[var(--destructive)]'
                      }`}
                    >
                      {data.content.approvalRate >= 70
                        ? '✅ Funciona'
                        : data.content.approvalRate >= 40
                          ? '⚠️ Estable'
                          : '❌ No funciona'}
                    </span>
                  </div>
                  <div className="mb-1 h-2 overflow-hidden rounded-full bg-[var(--secondary)]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        data.content.approvalRate >= 70
                          ? 'bg-[var(--success)]'
                          : data.content.approvalRate >= 40
                            ? 'bg-[var(--warning)]'
                            : 'bg-[var(--destructive)]'
                      }`}
                      style={{ width: `${Math.min(data.content.approvalRate, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--foreground-subtle)]">
                    {data.content.approvalRate >= 70
                      ? 'El contenido se está aprobando bien. Mantén el ritmo de producción.'
                      : data.content.approvalRate >= 40
                        ? 'Aprobación moderada. Revisa briefs y alineación con cliente.'
                        : 'Mucho contenido rechazado. Ajusta la calidad y el brief inicial.'}
                  </p>
                </div>

                {/* Campaign status */}
                <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)]">
                  <div className="mb-[var(--spacing-sm)] flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      Campañas activas
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        data.campaigns.active > 0
                          ? 'text-[var(--success)]'
                          : 'text-[var(--warning)]'
                      }`}
                    >
                      {data.campaigns.active > 0
                        ? '✅ Activas'
                        : '⚠️ Sin actividad'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--foreground-subtle)]">
                    {data.campaigns.active > 0
                      ? `${data.campaigns.active} campaña(s) activa(s) de ${data.campaigns.total}. Monitorea resultados semanalmente.`
                      : 'No hay campañas activas. Crea una campaña para empezar a generar resultados.'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}