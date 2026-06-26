import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell, superadminNavigation } from '@/components/layout/DashboardShell';
import { InputText } from '@/components/atoms/InputText';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { listAuditLogs } from '@/services/audit';
import type { AuditLog } from '@/types/audit';

const filterInputClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

export default function AuditLogsPage() {
  const [tenantId, setTenantId] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const logsQuery = useQuery({
    queryKey: ['audit-logs', { tenantId, action, from, to }],
    queryFn: () =>
      listAuditLogs({
        page: 1,
        limit: 50,
        tenantId: tenantId.trim() || undefined,
        action: action.trim() || undefined,
        from: from.trim() || undefined,
        to: to.trim() || undefined,
      }),
  });

  const items = logsQuery.data?.items ?? [];

  const columns: DataTableColumn[] = [
    {
      field: 'createdAt',
      header: 'Fecha',
      sortable: true,
      body: (row) =>
        new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(
          new Date((row as AuditLog).createdAt),
        ),
    },
    { field: 'action', header: 'Acción', sortable: true },
    {
      field: 'tenantId',
      header: 'Tenant',
      body: (row) => (row as AuditLog).tenantId ?? '—',
    },
    {
      field: 'userId',
      header: 'Usuario',
      body: (row) => (row as AuditLog).userId ?? '—',
    },
    {
      field: 'resourceType',
      header: 'Recurso',
      body: (row) => {
        const log = row as AuditLog;
        if (!log.resourceType) return '—';
        return log.resourceId ? `${log.resourceType}:${log.resourceId.slice(0, 8)}…` : log.resourceType;
      },
    },
    {
      field: 'ipAddress',
      header: 'IP',
      body: (row) => (row as AuditLog).ipAddress ?? '—',
    },
  ];

  return (
    <DashboardShell navigationOverride={superadminNavigation}>
      <div className="space-y-6">
        <PageHeader
          title="Logs de auditoría"
          description="Registro append-only de acciones sensibles (retención 90 días)."
        />

        <Card className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Tenant ID
            </label>
            <input
              className={filterInputClass}
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
              placeholder="UUID del tenant"
            />
          </div>
          <InputText
            label="Acción"
            placeholder="tenant.created"
            value={action}
            onChange={(event) => setAction(event.target.value)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Desde (ISO)
            </label>
            <input
              className={filterInputClass}
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              placeholder="2026-01-01"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Hasta (ISO)
            </label>
            <input
              className={filterInputClass}
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="2026-12-31"
            />
          </div>
        </Card>

        <DataTable
          columns={columns}
          data={items}
          loading={logsQuery.isLoading}
          emptyMessage="No hay logs con estos filtros"
        />
      </div>
    </DashboardShell>
  );
}
