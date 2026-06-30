import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, List, Plus, Sparkles } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { CampaignAgentReadinessPanel } from '@/components/campaigns/CampaignAgentReadinessPanel';
import { CampaignKanban } from '@/components/campaigns/CampaignKanban';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { listCampaigns, updateCampaign, getCampaignAgentReadiness, autoGenerateCampaign } from '@/services/campaigns';
import type { Campaign, CampaignStatus } from '@/types/campaign';

type ViewMode = 'table' | 'kanban';

const STATUS_OPTIONS: Array<{ label: string; value: '' | CampaignStatus }> = [
  { label: 'Todos los estados', value: '' },
  { label: 'Borrador', value: 'draft' },
  { label: 'Programada', value: 'scheduled' },
  { label: 'Activa', value: 'active' },
  { label: 'Pausada', value: 'paused' },
  { label: 'Completada', value: 'completed' },
];

const PLATFORM_OPTIONS = [
  { label: 'Todas las plataformas', value: '' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Google', value: 'google' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Email', value: 'email' },
];

function statusVariant(status: CampaignStatus) {
  if (status === 'active') return 'success';
  if (status === 'scheduled') return 'info';
  if (status === 'paused') return 'warning';
  if (status === 'completed') return 'neutral';
  return 'neutral';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(value));
}

const filterSelectClass =
  'h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

export default function CampaignListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [statusFilter, setStatusFilter] = useState<'' | CampaignStatus>('');
  const [platformFilter, setPlatformFilter] = useState('');

  const campaignsQuery = useQuery({
    queryKey: ['campaigns', { status: statusFilter, platform: platformFilter }],
    queryFn: () =>
      listCampaigns({
        page: 1,
        limit: 100,
        status: statusFilter || undefined,
        platform: platformFilter || undefined,
      }),
  });

  const readinessQuery = useQuery({
    queryKey: ['campaign-agent-readiness'],
    queryFn: getCampaignAgentReadiness,
  });

  const autoGenerateMutation = useMutation({
    mutationFn: autoGenerateCampaign,
    onSuccess: (result) => {
      toast.success(result.message);
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-agent-readiness'] });
      navigate(`/campaigns/${result.campaignId}`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo generar la campaña');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CampaignStatus }) =>
      updateCampaign(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Estado de campaña actualizado');
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo mover la campaña';
      toast.error(message);
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const tableData = useMemo(() => campaignsQuery.data?.items ?? [], [campaignsQuery.data?.items]);

  const columns: DataTableColumn[] = useMemo(
    () => [
      {
        field: 'name',
        header: 'Nombre',
        sortable: true,
        filterable: true,
        body: (row: Campaign) => (
          <Link
            to={`/campaigns/${row.id}`}
            className="font-medium text-[var(--primary)] hover:underline"
          >
            {row.name}
          </Link>
        ),
      },
      {
        field: 'status',
        header: 'Estado',
        sortable: true,
        width: '130px',
        body: (row: Campaign) => (
          <StatusPill status={statusVariant(row.status)} size="sm">
            {row.status}
          </StatusPill>
        ),
      },
      {
        field: 'platforms',
        header: 'Plataformas',
        body: (row: Campaign) => row.platforms.join(', ') || '—',
      },
      {
        field: 'totalBudget',
        header: 'Presupuesto',
        sortable: true,
        body: (row: Campaign) =>
          row.totalBudget != null ? `$${row.totalBudget.toLocaleString('es-ES')}` : '—',
      },
      {
        field: 'createdAt',
        header: 'Creada',
        sortable: true,
        body: (row: Campaign) => formatDate(row.createdAt),
      },
    ],
    [],
  );

  return (
    <DashboardShell>
      <PageHeader
        title="Campañas"
        description="Gestiona campañas multicanal y su pipeline de estados"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/campaigns/new">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Nueva campaña
              </Button>
            </Link>
            {readinessQuery.data?.ready && (
              <Button
                loading={autoGenerateMutation.isPending}
                onClick={() => autoGenerateMutation.mutate()}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Campaña automática
              </Button>
            )}
          </div>
        }
      />

      {readinessQuery.data && (
        <div className="mb-6">
          <CampaignAgentReadinessPanel
            readiness={readinessQuery.data}
            loading={autoGenerateMutation.isPending}
            onAutoGenerate={() => autoGenerateMutation.mutate()}
          />
        </div>
      )}

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            className={filterSelectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | CampaignStatus)}
            aria-label="Filtrar por estado"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={filterSelectClass}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            aria-label="Filtrar por plataforma"
          >
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="ml-auto flex gap-1 rounded-[var(--radius)] border border-[var(--border)] p-1">
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              onClick={() => setViewMode('table')}
            >
              <List className="mr-1 h-4 w-4" />
              Lista
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="mr-1 h-4 w-4" />
              Kanban
            </Button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={tableData}
            loading={campaignsQuery.isLoading}
            emptyMessage={
              campaignsQuery.isError
                ? 'No se pudo cargar el listado de campañas'
                : 'No hay campañas que coincidan con los filtros'
            }
            rows={10}
          />
        ) : (
          <CampaignKanban
            campaigns={tableData}
            loading={campaignsQuery.isLoading}
            onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          />
        )}

        {campaignsQuery.data && (
          <p className="mt-3 text-xs text-[var(--foreground-muted)]">
            Total: {campaignsQuery.data.total} campaña
            {campaignsQuery.data.total === 1 ? '' : 's'}
          </p>
        )}
      </Card>
    </DashboardShell>
  );
}
