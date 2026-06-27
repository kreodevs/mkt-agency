import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { DashboardShell, superadminNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { Dialog } from '@/components/molecules/Dialog';
import { InputText } from '@/components/atoms/InputText';
import { StatusPill } from '@/components/atoms/StatusPill';
import { toast } from '@/components/molecules/Sonner';
import {
  listLlmProviders,
  listLlmTasks,
  updateLlmTask,
  type LlmTaskConfig,
} from '@/services/superadmin';

const selectClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

export default function LlmSettingsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<LlmTaskConfig | null>(null);
  const [providerId, setProviderId] = useState('');
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [enabled, setEnabled] = useState(true);

  const tasksQuery = useQuery({
    queryKey: ['llm-tasks'],
    queryFn: listLlmTasks,
  });

  const providersQuery = useQuery({
    queryKey: ['llm-providers', { activeOnly: true }],
    queryFn: () => listLlmProviders(false),
  });

  const activeProviders = providersQuery.data ?? [];

  useEffect(() => {
    if (editing) {
      setProviderId(editing.providerId ?? activeProviders[0]?.id ?? '');
      setModel(editing.model);
      setTemperature(String(editing.temperature));
      setEnabled(editing.enabled);
    }
  }, [editing, activeProviders]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateLlmTask(editing!.taskType, {
        providerId,
        model: model.trim(),
        temperature: Number(temperature),
        enabled,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-tasks'] });
      setEditing(null);
      toast.success('Configuración LLM actualizada');
    },
    onError: () => toast.error('Error al guardar configuración LLM'),
  });

  const columns: DataTableColumn[] = [
    { field: 'label', header: 'Tarea' },
    { field: 'taskType', header: 'Tipo' },
    {
      field: 'providerName',
      header: 'Proveedor',
      body: (row) => (row as LlmTaskConfig).providerName ?? '—',
    },
    { field: 'model', header: 'Modelo' },
    {
      field: 'temperature',
      header: 'Temp.',
      body: (row) => String((row as LlmTaskConfig).temperature),
    },
    {
      field: 'enabled',
      header: 'Estado',
      body: (row) => (
        <StatusPill status={(row as LlmTaskConfig).enabled ? 'success' : 'warning'}>
          {(row as LlmTaskConfig).enabled ? 'Activo' : 'Desactivado'}
        </StatusPill>
      ),
    },
    {
      field: 'actions',
      header: '',
      body: (row) => {
        const task = row as LlmTaskConfig;
        return (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(task)}
          >
            Configurar
          </Button>
        );
      },
    },
  ];

  return (
    <DashboardShell navigationOverride={superadminNavigation}>
      <PageHeader
        title="Tareas LLM"
        description="Asigna proveedor y modelo por tipo de tarea de IA."
      />

      <Card className="mt-6">
        <DataTable
          columns={columns}
          data={tasksQuery.data ?? []}
          loading={tasksQuery.isLoading}
        />
      </Card>

      <Dialog
        visible={!!editing}
        onHide={() => setEditing(null)}
        title={editing ? `Tarea: ${editing.label}` : 'Tarea LLM'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-[var(--spacing-xs)]">
            <label className="text-sm font-medium">Proveedor</label>
            <select
              className={selectClass}
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
            >
              {activeProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.apiKeyConfigured ? '' : '(sin API key)'}
                </option>
              ))}
            </select>
          </div>
          <InputText
            label="Modelo"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="deepseek/deepseek-v4-flash"
            fullWidth
          />
          <InputText
            label="Temperatura (0–2)"
            type="number"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            fullWidth
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Tarea habilitada
          </label>
          <p className="text-xs text-[var(--foreground-muted)]">
            Configura proveedores y API keys en{' '}
            <a href="/admin/llm-providers" className="text-[var(--primary)] underline">
              Proveedores LLM
            </a>
            .
          </p>
        </div>
      </Dialog>
    </DashboardShell>
  );
}
