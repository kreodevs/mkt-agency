import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { DashboardShell, superadminNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { Dialog } from '@/components/molecules/Dialog';
import { InputText } from '@/components/atoms/InputText';
import { StatusPill } from '@/components/atoms/StatusPill';
import { toast } from '@/components/molecules/Sonner';
import { formatModelOptionLabel } from '@/lib/llm-models';
import {
  listLlmProviderModels,
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

  const configuredProviders = useMemo(
    () => (providersQuery.data ?? []).filter((p) => p.isActive && p.apiKeyConfigured),
    [providersQuery.data],
  );

  useEffect(() => {
    if (editing) {
      setProviderId(editing.providerId ?? configuredProviders[0]?.id ?? '');
      setModel(editing.model);
      setTemperature(String(editing.temperature));
      setEnabled(editing.enabled);
    }
  }, [editing, configuredProviders]);

  const modelsQuery = useQuery({
    queryKey: ['llm-provider-models', providerId],
    queryFn: () => listLlmProviderModels(providerId),
    enabled: !!editing && !!providerId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const models = modelsQuery.data?.models ?? [];
    if (!models.length) {
      return;
    }

    if (model && models.some((item) => item.id === model)) {
      return;
    }

    const preferred =
      editing?.model && editing.providerId === providerId ? editing.model : null;
    const match = preferred ? models.find((item) => item.id === preferred) : null;
    setModel(match?.id ?? models[0].id);
  }, [modelsQuery.data, providerId, model, editing]);

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
          <Button size="sm" variant="ghost" onClick={() => setEditing(task)}>
            Configurar
          </Button>
        );
      },
    },
  ];

  const models = modelsQuery.data?.models ?? [];
  const canSave = Boolean(providerId && model.trim());

  return (
    <DashboardShell navigationOverride={superadminNavigation}>
      <PageHeader
        title="Tareas LLM"
        description="Puedes tener varios proveedores activos y asignar uno distinto a cada tarea o agente."
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
            <Button
              loading={saveMutation.isPending}
              disabled={!canSave}
              onClick={() => saveMutation.mutate()}
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {configuredProviders.length === 0 ? (
            <p className="text-sm text-[var(--destructive)]">
              No hay proveedores activos con API key. Configúralos en Proveedores LLM.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-[var(--spacing-xs)]">
                <label className="text-sm font-medium">Proveedor</label>
                <select
                  className={selectClass}
                  value={providerId}
                  onChange={(e) => {
                    setProviderId(e.target.value);
                    setModel('');
                  }}
                >
                  {configuredProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-[var(--spacing-xs)]">
                <label className="text-sm font-medium">Modelo</label>
                {modelsQuery.isLoading ? (
                  <p className="text-sm text-[var(--foreground-muted)]">Cargando modelos…</p>
                ) : modelsQuery.isError ? (
                  <p className="text-sm text-[var(--destructive)]">
                    No se pudieron cargar modelos del proveedor. Verifica URL y API key.
                  </p>
                ) : (
                  <select
                    className={selectClass}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={!models.length}
                  >
                    {models.map((item) => (
                      <option key={item.id} value={item.id}>
                        {formatModelOptionLabel(item)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}

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
            Los precios mostrados son USD por millón de tokens (entrada / salida) según el catálogo
            del proveedor. Configura proveedores en{' '}
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
