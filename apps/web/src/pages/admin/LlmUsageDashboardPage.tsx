import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Coins, Cpu, DollarSign, Layers, ShieldCheck, Zap } from 'lucide-react';
import { DashboardShell, superadminNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { InputText } from '@/components/atoms/InputText';
import { Select } from '@/components/atoms/Select';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { getLlmUsageDashboard } from '@/services/superadmin';
import type { LlmUsageTenantRow } from '@/types/llm-usage';

const filterInputClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

function formatUsd(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function formatTokens(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value);
}

function defaultFromDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}

function defaultToDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function LlmUsageDashboardPage() {
  const [from, setFrom] = useState(defaultFromDate);
  const [to, setTo] = useState(defaultToDate);
  const [agencyMarkup, setAgencyMarkup] = useState<number>(30);

  const usageQuery = useQuery({
    queryKey: ['llm-usage-dashboard', { from, to }],
    queryFn: () => getLlmUsageDashboard(from || undefined, to || undefined),
  });

  const data = usageQuery.data;
  const summary = data?.summary;
  const byTenant = data?.byTenant ?? [];
  const daily = data?.daily ?? [];

  const projectedBillingTotal = summary
    ? summary.estimatedCostUsd * (1 + agencyMarkup / 100)
    : 0;

  const chartData = useMemo(
    () =>
      daily.map((row) => ({
        day: row.day.slice(5),
        cost: Number(row.estimatedCostUsd.toFixed(4)),
        tokens: row.totalTokens,
        calls: row.totalCalls,
      })),
    [daily],
  );

  const columns: DataTableColumn[] = [
    {
      field: 'tenantName',
      header: 'Cliente / Tenant',
      sortable: true,
      body: (row) => {
        const item = row as LlmUsageTenantRow;
        return (
          <div>
            <p className="font-medium text-[var(--foreground)]">
              {item.tenantName ?? (item.tenantId ? item.tenantId.slice(0, 8) : 'Plataforma')}
            </p>
            {item.tenantId && (
              <span className="text-[10px] text-[var(--foreground-muted)] font-mono">
                {item.tenantId.slice(0, 13)}…
              </span>
            )}
          </div>
        );
      },
    },
    {
      field: 'totalCalls',
      header: 'Llamadas',
      sortable: true,
      body: (row) => formatTokens((row as LlmUsageTenantRow).totalCalls),
    },
    {
      field: 'totalTokens',
      header: 'Tokens',
      sortable: true,
      body: (row) => formatTokens((row as LlmUsageTenantRow).totalTokens),
    },
    {
      field: 'estimatedCostUsd',
      header: 'Costo API Base',
      sortable: true,
      body: (row) => formatUsd((row as LlmUsageTenantRow).estimatedCostUsd),
    },
    {
      field: 'billedAmountUsd',
      header: `Facturable (+${agencyMarkup}%)`,
      sortable: true,
      body: (row) => {
        const item = row as LlmUsageTenantRow;
        const billed = item.estimatedCostUsd * (1 + agencyMarkup / 100);
        return (
          <span className="font-semibold text-[var(--success)]">
            {formatUsd(billed)}
          </span>
        );
      },
    },
    {
      field: 'spendingLimit',
      header: 'Límite Gasto',
      body: (row) => {
        const item = row as LlmUsageTenantRow;
        const limit = item.spendingLimitUsd ?? 100;
        const isNearLimit = item.estimatedCostUsd >= limit * 0.8;
        return (
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
              isNearLimit
                ? 'bg-[var(--warning)]/10 text-[var(--warning)]'
                : 'bg-[var(--success)]/10 text-[var(--success)]'
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            Máx {formatUsd(limit)}
          </span>
        );
      },
    },
  ];

  return (
    <DashboardShell navigationOverride={superadminNavigation}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Plataforma"
          title="Consumo IA"
          description="Tokens consumidos y costo estimado global y por tenant (OpenRouter)."
        />

        <Card className="grid max-w-2xl grid-cols-1 sm:grid-cols-3 gap-4 p-4">
          <label className="space-y-1 text-sm">
            <span className="text-[var(--foreground-muted)]">Desde</span>
            <InputText
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className={filterInputClass}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--foreground-muted)]">Hasta</span>
            <InputText
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className={filterInputClass}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--foreground-muted)]">Margen Agencia</span>
            <Select
              value={String(agencyMarkup)}
              onChange={(e) => setAgencyMarkup(Number(e.target.value))}
              options={[
                { value: '0', label: 'Sin margen (0%)' },
                { value: '20', label: '+20% margen' },
                { value: '30', label: '+30% estándar' },
                { value: '50', label: '+50% premium' },
                { value: '100', label: '+100% doble' },
              ]}
            />
          </label>
        </Card>

        {usageQuery.isLoading ? (
          <div className="py-16 text-center text-[var(--foreground-muted)]">Cargando consumo…</div>
        ) : !summary ? (
          <div className="py-16 text-center text-[var(--foreground-muted)]">
            No hay datos de consumo en el rango seleccionado.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <KpiCard
                icon={Coins}
                label="Costo API Base"
                value={formatUsd(summary.estimatedCostUsd)}
                hint="Gasto neto de la agencia en OpenRouter"
              />
              <KpiCard
                icon={DollarSign}
                label="Facturable Clientes"
                value={formatUsd(projectedBillingTotal)}
                hint={`Con margen comercial de +${agencyMarkup}%`}
              />
              <KpiCard
                icon={Zap}
                label="Tokens totales"
                value={formatTokens(summary.totalTokens)}
                hint={`${formatTokens(summary.promptTokens)} entrada · ${formatTokens(summary.completionTokens)} salida`}
              />
              <KpiCard
                icon={Cpu}
                label="Llamadas LLM"
                value={formatTokens(summary.totalCalls)}
              />
              <KpiCard
                icon={Layers}
                label="Tenants activos"
                value={formatTokens(byTenant.filter((row) => row.tenantId).length)}
              />
            </div>

            <Card className="p-4">
              <h2 className="mb-4 text-sm font-medium text-[var(--foreground-muted)]">
                Costo diario estimado (USD)
              </h2>
              {chartData.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--foreground-muted)]">
                  Sin actividad en el periodo.
                </p>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="day" tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }} />
                      <YAxis
                        tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          const numeric = typeof value === 'number' ? value : Number(value ?? 0);
                          return name === 'cost' ? formatUsd(numeric) : formatTokens(numeric);
                        }}
                        labelFormatter={(label) => `Día ${label}`}
                      />
                      <Bar dataKey="cost" fill="#6366f1" radius={[4, 4, 0, 0]} name="cost" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h2 className="mb-4 text-sm font-medium text-[var(--foreground-muted)]">
                Desglose por tenant
              </h2>
              <DataTable
                data={byTenant}
                columns={columns}
                loading={usageQuery.isLoading}
                emptyMessage="Sin consumo registrado por tenant."
              />
            </Card>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="text-xs text-[var(--foreground-muted)]">{hint}</p> : null}
    </Card>
  );
}
