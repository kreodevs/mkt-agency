import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ReportDataView } from '@/components/reports/ReportDataView';
import { StatusPill } from '@/components/atoms/StatusPill';
import { PageHeader } from '@/components/molecules/PageHeader';
import { getReport } from '@/services/reports';
import {
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  reportStatusVariant,
} from '@/types/reports';

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();

  const reportQuery = useQuery({
    queryKey: ['report', id],
    queryFn: () => getReport(id!),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === 'generating' ? 3000 : false,
  });

  const report = reportQuery.data;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <Link
          to="/reports"
          className="inline-flex items-center text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver
        </Link>

        {report ? (
          <>
            <PageHeader
              title={REPORT_TYPE_LABELS[report.type]}
              description={`Solicitado el ${new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(report.createdAt))}`}
              actions={
                <StatusPill status={reportStatusVariant(report.status)} size="sm">
                  {REPORT_STATUS_LABELS[report.status]}
                </StatusPill>
              }
            />

            {report.status === 'generating' ? (
              <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando análisis con IA…
              </div>
            ) : (
              <ReportDataView data={report.data} />
            )}
          </>
        ) : reportQuery.isLoading ? (
          <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
        ) : (
          <p className="text-sm text-[var(--destructive)]">Reporte no encontrado</p>
        )}
      </div>
    </DashboardShell>
  );
}
