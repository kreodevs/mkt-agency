import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Plus } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { IconButton } from '@/components/atoms/IconButton';
import { StatusPill } from '@/components/atoms/StatusPill';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { createReport, listReports } from '@/services/reports';
import {
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  reportStatusVariant,
  type Report,
  type ReportType,
} from '@/types/reports';

const filterSelectClass =
  'h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

export default function ReportListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [type, setType] = useState<ReportType>('campaign_performance');

  const reportsQuery = useQuery({
    queryKey: ['reports'],
    queryFn: () => listReports({ limit: 50 }),
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      return items.some((item) => item.status === 'generating') ? 3000 : false;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => createReport({ type }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Reporte en generación');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo crear');
    },
  });

  const items = reportsQuery.data?.items ?? [];

  const columns: DataTableColumn[] = [
    {
      field: 'type',
      header: 'Tipo',
      body: (row) => REPORT_TYPE_LABELS[(row as Report).type],
    },
    {
      field: 'status',
      header: 'Estado',
      body: (row) => {
        const report = row as Report;
        return (
          <StatusPill status={reportStatusVariant(report.status)} size="sm">
            {REPORT_STATUS_LABELS[report.status]}
          </StatusPill>
        );
      },
    },
    {
      field: 'createdAt',
      header: 'Creado',
      body: (row) =>
        new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(
          new Date((row as Report).createdAt),
        ),
    },
    {
      field: 'actions',
      header: '',
      body: (row) => (
        <IconButton label="Ver detalle" onClick={() => navigate(`/reports/${(row as Report).id}`)}>
          <Eye />
        </IconButton>
      ),
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Reportes"
          description="Informes de rendimiento generados por IA a partir de tus datos."
        />

        <Card className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Tipo de reporte
            </label>
            <select
              className={filterSelectClass}
              value={type}
              onChange={(event) => setType(event.target.value as ReportType)}
            >
              {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Generar reporte
          </Button>
        </Card>

        <DataTable
          columns={columns}
          data={items}
          loading={reportsQuery.isLoading}
          emptyMessage="Aún no hay reportes"
        />
      </div>
    </DashboardShell>
  );
}
