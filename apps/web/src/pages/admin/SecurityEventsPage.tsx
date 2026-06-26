import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell, superadminNavigation } from '@/components/layout/DashboardShell';
import { InputText } from '@/components/atoms/InputText';
import { StatusPill } from '@/components/atoms/StatusPill';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { listSecurityEvents } from '@/services/security';
import type { SecurityEvent, SecurityEventSeverity } from '@/types/security';

const filterInputClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

const severityOptions: { value: '' | SecurityEventSeverity; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

function severityStatus(severity: SecurityEventSeverity) {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'error' as const;
    case 'medium':
      return 'warning' as const;
    case 'low':
      return 'info' as const;
    default:
      return 'neutral' as const;
  }
}

export default function SecurityEventsPage() {
  const [severity, setSeverity] = useState<'' | SecurityEventSeverity>('');
  const [eventType, setEventType] = useState('');

  const eventsQuery = useQuery({
    queryKey: ['security-events', { severity, eventType }],
    queryFn: () =>
      listSecurityEvents({
        page: 1,
        limit: 50,
        severity: severity || undefined,
        eventType: eventType.trim() || undefined,
      }),
  });

  const items = eventsQuery.data?.items ?? [];

  const columns: DataTableColumn[] = [
    {
      field: 'createdAt',
      header: 'Fecha',
      sortable: true,
      body: (row) =>
        new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(
          new Date((row as SecurityEvent).createdAt),
        ),
    },
    { field: 'eventType', header: 'Tipo', sortable: true },
    {
      field: 'severity',
      header: 'Severidad',
      body: (row) => {
        const event = row as SecurityEvent;
        return (
          <StatusPill status={severityStatus(event.severity)}>
            {event.severity}
          </StatusPill>
        );
      },
    },
    {
      field: 'tenantId',
      header: 'Tenant',
      body: (row) => (row as SecurityEvent).tenantId ?? '—',
    },
    {
      field: 'userId',
      header: 'Usuario',
      body: (row) => (row as SecurityEvent).userId ?? '—',
    },
    {
      field: 'ipAddress',
      header: 'IP',
      body: (row) => (row as SecurityEvent).ipAddress ?? '—',
    },
    {
      field: 'metadata',
      header: 'Detalle',
      body: (row) => {
        const metadata = (row as SecurityEvent).metadata;
        if (!metadata || Object.keys(metadata).length === 0) return '—';
        return JSON.stringify(metadata);
      },
    },
  ];

  return (
    <DashboardShell navigationOverride={superadminNavigation}>
      <div className="space-y-6">
        <PageHeader
          title="Eventos de seguridad"
          description="Intentos de acceso, bloqueos y alertas de seguridad del sistema."
        />

        <Card className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Severidad
            </label>
            <select
              className={filterInputClass}
              value={severity}
              onChange={(event) =>
                setSeverity(event.target.value as '' | SecurityEventSeverity)
              }
            >
              {severityOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <InputText
            label="Tipo de evento"
            placeholder="auth.login_failed"
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
          />
        </Card>

        <DataTable
          columns={columns}
          data={items}
          loading={eventsQuery.isLoading}
          emptyMessage="No hay eventos con estos filtros"
        />
      </div>
    </DashboardShell>
  );
}
