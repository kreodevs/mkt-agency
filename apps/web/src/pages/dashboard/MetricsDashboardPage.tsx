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
  AlertCircle,
} from 'lucide-react';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
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
        <div className="space-y-6">
          {/* Row 1: KPI cards */}
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
              indicator={
                data.leads.conversionRate >= 20
                  ? { type: 'positive', text: '¡Funciona!' }
                  : data.leads.conversionRate >= 10
                    ? { type: 'neutral', text: 'Estable' }
                    : { type: 'negative', text: 'Mejorable' }
              }
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
              label="Campañas activas"
              value={`${data.campaigns.active}/${data.campaigns.total}`}
              color="text-amber-600"
              bg="bg-amber-500/10"
              indicator={
                data.campaigns.active > 0
                  ? { type: 'positive', text: `${data.campaigns.active} en curso` }
                  : { type: 'neutral', text: 'Sin campañas activas' }
              }
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
                  <div className="flex items-center gap-2 border-t border-[var(--border)] pt-2 text-sm font-medium text-emerald-500">
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
                <div className="rounded-xl border border-[var(--border)] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      Tasa de conversión
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        data.leads.conversionRate >= 20
                          ? 'text-emerald-500'
                          : data.leads.conversionRate >= 10
                            ? 'text-amber-500'
                            : 'text-red-500'
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
                          ? 'bg-emerald-500'
                          : data.leads.conversionRate >= 10
                            ? 'bg-amber-500'
                            : 'bg-red-500'
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
                <div className="rounded-xl border border-[var(--border)] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      Tasa de aprobación
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        data.content.approvalRate >= 70
                          ? 'text-emerald-500'
                          : data.content.approvalRate >= 40
                            ? 'text-amber-500'
                            : 'text-red-500'
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
                          ? 'bg-emerald-500'
                          : data.content.approvalRate >= 40
                            ? 'bg-amber-500'
                            : 'bg-red-500'
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
                <div className="rounded-xl border border-[var(--border)] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      Campañas activas
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        data.campaigns.active > 0
                          ? 'text-emerald-500'
                          : 'text-amber-500'
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

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  indicator,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  indicator?: { type: 'positive' | 'neutral' | 'negative'; text: string };
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:shadow-md">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-black text-[var(--foreground)]">{value}</p>
        {indicator && (
          <p
            className={`mt-0.5 flex items-center gap-1 text-[10px] font-medium ${
              indicator.type === 'positive'
                ? 'text-emerald-500'
                : indicator.type === 'negative'
                  ? 'text-red-500'
                  : 'text-amber-500'
            }`}
          >
            {indicator.type === 'positive' ? (
              <TrendingUp className="h-3 w-3" />
            ) : indicator.type === 'negative' ? (
              <AlertCircle className="h-3 w-3" />
            ) : (
              <Activity className="h-3 w-3" />
            )}
            {indicator.text}
          </p>
        )}
      </div>
    </div>
  );
}