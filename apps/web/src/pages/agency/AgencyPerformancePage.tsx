import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  getPaidPerformanceCross,
  importAdPerformanceCsv,
  listAdPerformanceImports,
} from '@/services/operating-profile';
import { useResolvedProductId } from '@/hooks/useResolvedProductId';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export default function AgencyPerformancePage() {
  const productId = useResolvedProductId();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [platform, setPlatform] = useState<'auto' | 'meta' | 'google'>('auto');

  const paidQuery = useQuery({
    queryKey: ['agency-paid-performance', productId],
    queryFn: () => getPaidPerformanceCross(productId ?? undefined),
  });

  const importsQuery = useQuery({
    queryKey: ['agency-performance-imports'],
    queryFn: () => listAdPerformanceImports(8),
  });

  const importMutation = useMutation({
    mutationFn: (file: File) =>
      importAdPerformanceCsv(file, {
        productId: productId ?? undefined,
        platform,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-paid-performance'] });
      queryClient.invalidateQueries({ queryKey: ['agency-performance-imports'] });
      toast.success('CSV importado correctamente');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo importar el CSV');
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    importMutation.mutate(file);
    event.target.value = '';
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Rendimiento de pauta"
        description="Importa tu export de Meta o Google Ads y cruza el gasto con los leads capturados en la plataforma."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Importar resultados"
          subtitle="CSV exportado desde Ads Manager (máx. 5 MB)"
        >
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              {(['auto', 'meta', 'google'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded px-3 py-1 text-xs ${
                    platform === value
                      ? 'bg-[var(--primary)] text-white'
                      : 'border border-[var(--border)]'
                  }`}
                  onClick={() => setPlatform(value)}
                >
                  {value === 'auto' ? 'Detectar' : value === 'meta' ? 'Meta' : 'Google'}
                </button>
              ))}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              className="gap-2"
              disabled={importMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" aria-hidden />
              {importMutation.isPending ? 'Importando…' : 'Subir CSV'}
            </Button>

            <p className="text-xs text-[var(--foreground-muted)]">
              Usa columnas estándar: campaña, gasto, impresiones, clics y conversiones. Los leads
              se atribuyen por UTM (`utm_medium=cpc` o fuente Meta/Google).
            </p>
          </div>
        </Card>

        <Card title="Resumen cruzado" subtitle="Últimos 30 días">
          {paidQuery.isLoading && (
            <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
          )}
          {paidQuery.data && (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[var(--foreground-muted)]">Gasto importado</dt>
                <dd className="font-semibold">{formatMoney(paidQuery.data.ads.spend)}</dd>
              </div>
              <div>
                <dt className="text-[var(--foreground-muted)]">Clics</dt>
                <dd className="font-semibold">{paidQuery.data.ads.clicks}</dd>
              </div>
              <div>
                <dt className="text-[var(--foreground-muted)]">Leads atribuidos (pauta)</dt>
                <dd className="font-semibold">{paidQuery.data.leads.attributedPaidLeads}</dd>
              </div>
              <div>
                <dt className="text-[var(--foreground-muted)]">CPL estimado</dt>
                <dd className="font-semibold">
                  {paidQuery.data.metrics.costPerLead != null
                    ? formatMoney(paidQuery.data.metrics.costPerLead)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--foreground-muted)]">CPC</dt>
                <dd className="font-semibold">
                  {paidQuery.data.metrics.costPerClick != null
                    ? formatMoney(paidQuery.data.metrics.costPerClick)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--foreground-muted)]">Imports en periodo</dt>
                <dd className="font-semibold">{paidQuery.data.ads.importCount}</dd>
              </div>
            </dl>
          )}
          {paidQuery.data?.ads.importCount === 0 && !paidQuery.isLoading && (
            <p className="mt-3 text-xs text-[var(--foreground-muted)]">
              Sube un CSV para ver gasto y CPL estimado frente a tus leads.
            </p>
          )}
        </Card>

        <Card title="Imports recientes" className="lg:col-span-2">
          {importsQuery.isLoading && (
            <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
          )}
          <ul className="space-y-2 text-sm">
            {(importsQuery.data ?? []).map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--border)] px-3 py-2"
              >
                <div>
                  <p className="font-medium">{item.fileName}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {item.platform} · {item.rowCount} filas ·{' '}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-medium">{formatMoney(item.totals.spend)}</p>
              </li>
            ))}
            {(importsQuery.data ?? []).length === 0 && !importsQuery.isLoading && (
              <p className="text-[var(--foreground-muted)]">Aún no hay imports.</p>
            )}
          </ul>
        </Card>
      </div>
    </DashboardShell>
  );
}
