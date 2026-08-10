import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, UserRoundSearch } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { IconButton, ACTION_BUTTON_GROUP_CLASS } from '@/components/atoms/IconButton';
import { StatusPill } from '@/components/atoms/StatusPill';
import { TenantListCard } from '@/components/tenants/TenantListCard';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { listTenants } from '@/services/tenants';
import { impersonateTenant } from '@/services/superadmin';
import { getApiErrorMessage } from '@/services/api';
import type { Tenant, TenantPlan, TenantStatus } from '@/types/tenant';
import { CreateTenantModal } from './CreateTenantModal';
import { EditTenantModal } from './EditTenantModal';

const STATUS_OPTIONS: Array<{ label: string; value: '' | TenantStatus }> = [
  { label: 'Todos los estados', value: '' },
  { label: 'Activo', value: 'active' },
  { label: 'Suspendido', value: 'suspended' },
  { label: 'Eliminado', value: 'deleted' },
];

const PLAN_OPTIONS: Array<{ label: string; value: '' | TenantPlan }> = [
  { label: 'Todos los planes', value: '' },
  { label: 'Starter', value: 'starter' },
  { label: 'Professional', value: 'professional' },
  { label: 'Enterprise', value: 'enterprise' },
];

function statusVariant(status: TenantStatus) {
  if (status === 'active') return 'success';
  if (status === 'suspended') return 'warning';
  return 'error';
}

function planVariant(plan: TenantPlan) {
  if (plan === 'enterprise') return 'luxury';
  if (plan === 'professional') return 'info';
  return 'neutral';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function TenantListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'' | TenantStatus>('');
  const [planFilter, setPlanFilter] = useState<'' | TenantPlan>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTenantId, setEditTenantId] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const tenantsQuery = useQuery({
    queryKey: ['tenants', { status: statusFilter, plan: planFilter }],
    queryFn: () =>
      listTenants({
        page: 1,
        limit: 100,
        status: statusFilter || undefined,
        plan: planFilter || undefined,
      }),
  });

  const tableData = useMemo(() => tenantsQuery.data?.items ?? [], [tenantsQuery.data?.items]);

  const columns: DataTableColumn[] = useMemo(
    () => [
      {
        field: 'name',
        header: 'Nombre',
        sortable: true,
        filterable: true,
        width: '220px',
      },
      {
        field: 'slug',
        header: 'Slug',
        sortable: true,
        filterable: true,
        width: '180px',
      },
      {
        field: 'plan',
        header: 'Plan',
        sortable: true,
        width: '140px',
        body: (row: Tenant) => (
          <StatusPill status={planVariant(row.plan)} size="sm">
            {row.plan}
          </StatusPill>
        ),
      },
      {
        field: 'status',
        header: 'Estado',
        sortable: true,
        width: '130px',
        body: (row: Tenant) => (
          <StatusPill status={statusVariant(row.status)} size="sm">
            {row.status}
          </StatusPill>
        ),
      },
      {
        field: 'maxUsers',
        header: 'Usuarios máx.',
        sortable: true,
        width: '120px',
      },
      {
        field: 'createdAt',
        header: 'Creado',
        sortable: true,
        width: '180px',
        body: (row: Tenant) => formatDate(row.createdAt),
      },
      {
        field: 'actions',
        header: 'Acciones',
        width: '120px',
        body: (row: Tenant) => (
          <div className={ACTION_BUTTON_GROUP_CLASS}>
            <IconButton label="Editar tenant" onClick={() => setEditTenantId(row.id)}>
              <Pencil />
            </IconButton>
            <IconButton
              tone="primary"
              label="Impersonar tenant"
              loading={impersonatingId === row.id}
              disabled={row.status !== 'active'}
              onClick={() => {
                setImpersonatingId(row.id);
                void impersonateTenant(row.id)
                  .then(() => navigate('/'))
                  .catch((err) => {
                    window.alert(getApiErrorMessage(err));
                  })
                  .finally(() => setImpersonatingId(null));
              }}
            >
              <UserRoundSearch />
            </IconButton>
          </div>
        ),
      },
    ],
    [impersonatingId, navigate],
  );

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Plataforma"
        title="Tenants"
        description="Gestión de organizaciones registradas en la plataforma"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo tenant
          </Button>
        }
      />

      <CreateTenantModal
        visible={createOpen}
        onHide={() => setCreateOpen(false)}
        onCreated={() => void queryClient.invalidateQueries({ queryKey: ['tenants'] })}
      />

      <EditTenantModal
        tenantId={editTenantId}
        visible={!!editTenantId}
        onHide={() => setEditTenantId(null)}
        onUpdated={() => void queryClient.invalidateQueries({ queryKey: ['tenants'] })}
      />

      <Card>
        <div className="filter-row mb-4">
          <Select
            fullWidth={false}
            className="min-w-[11rem] sm:w-auto"
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | TenantStatus)}
            options={STATUS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
          <Select
            fullWidth={false}
            className="min-w-[11rem] sm:w-auto"
            aria-label="Filtrar por plan"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as '' | TenantPlan)}
            options={PLAN_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        </div>

        <div className="space-y-[var(--spacing-md)] md:hidden">
          {tableData.map((tenant) => (
            <TenantListCard
              key={tenant.id}
              tenant={tenant}
              impersonating={impersonatingId === tenant.id}
              onEdit={() => setEditTenantId(tenant.id)}
              onImpersonate={() => {
                setImpersonatingId(tenant.id);
                void impersonateTenant(tenant.id)
                  .then(() => navigate('/'))
                  .catch((err) => {
                    window.alert(getApiErrorMessage(err));
                  })
                  .finally(() => setImpersonatingId(null));
              }}
            />
          ))}
          {!tenantsQuery.isLoading && tableData.length === 0 ? (
            <p className="text-center text-sm text-[var(--foreground-muted)]">
              {tenantsQuery.isError
                ? 'No se pudo cargar el listado de tenants'
                : 'No hay tenants que coincidan con los filtros'}
            </p>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <DataTable
            columns={columns}
            data={tableData}
            loading={tenantsQuery.isLoading}
            emptyMessage={
              tenantsQuery.isError
                ? 'No se pudo cargar el listado de tenants'
                : 'No hay tenants que coincidan con los filtros'
            }
            rows={10}
          />
        </div>

        {tenantsQuery.data && (
          <p className="mt-3 text-xs text-[var(--foreground-muted)]">
            Total en servidor: {tenantsQuery.data.total} tenant
            {tenantsQuery.data.total === 1 ? '' : 's'}
          </p>
        )}
      </Card>
    </DashboardShell>
  );
}