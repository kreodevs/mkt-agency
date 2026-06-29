import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { LlmModelSelect } from '@/components/admin/LlmModelSelect';
import { DashboardShell, superadminNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { IconButton } from '@/components/atoms/IconButton';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { Dialog } from '@/components/molecules/Dialog';
import { InputText } from '@/components/atoms/InputText';
import { StatusPill } from '@/components/atoms/StatusPill';
import { toast } from '@/components/molecules/Sonner';
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
    if (!editing) {
      return;
    }

    setProviderId(editing.providerId ?? configuredProviders[0]?.id ?? '');
    setModel(editing.model);
    setTemperature(String(editing.temperature));
    setEnabled(editing.enabled);
  }, [editing, configuredProviders]);

  useEffect(() => {
    if (!editing || !providerId) {
      return;
    }

    let cancelled = false;

    void listLlmProviderModels(providerId)
      .then((response) => {
        if (cancelled) {
          return;
        }

        const models = response.models;
        if (!models.length) {
          return;
        }

        setModel((current) => {
          if (current && models.some((item) => item.id === current)) {
            return current;
          }

          const preferred =
            editing.model && editing.providerId === providerId ? editing.model : null;
          const match = preferred ? models.find((item) => item.id === preferred) : null;
          return match?.id ?? models[0].id;
        });
      })
      .catch(() => {
        /* LlmModelSelect muestra error y reintento */
      });

    return () => {
      cancelled = true;
    };
  }, [editing, providerId]);

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
          <IconButton variant="ghost" label="Configurar tarea" onClick={() => setEditing(task)}>
            <Settings2 className="h-4 w-4" />
          </IconButton>
        );
      },
    },
  ];

  const canSave = Boolean(providerId && model.trim());

  return (
    <DashboardShell navigationOverride={superadminNavigation}>
      <PageHeader
        title="Modelos por tarea"
        description="Asigna proveedor y modelo a cada tarea de IA de la plataforma. Los agentes se operan en el tenant, no desde superadmin."
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
                <label htmlFor="llm-task-provider" className="text-sm font-medium">
                  Proveedor
                </label>
                <select
                  id="llm-task-provider"
                  className={selectClass}
                  value={providerId}
                  onChange={(event) => {
                    setProviderId(event.target.value);
                    setModel('');
                  }}
                >
                  {configuredProviders.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <LlmModelSelect
                providerId={providerId}
                value={model}
                onChange={setModel}
                enabled={Boolean(editing && providerId)}
              />
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
            El desplegable de modelo muestra el costo USD por millón de tokens (entrada / salida).
            Configura proveedores en{' '}
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
