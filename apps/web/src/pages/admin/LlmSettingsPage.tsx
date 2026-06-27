import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
  listLlmTasks,
  updateLlmTask,
  type LlmTaskConfig,
} from '@/services/superadmin';

export default function LlmSettingsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<LlmTaskConfig | null>(null);
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [enabled, setEnabled] = useState(true);

  const tasksQuery = useQuery({
    queryKey: ['llm-tasks'],
    queryFn: listLlmTasks,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      updateLlmTask(editing!.taskType, {
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
            onClick={() => {
              setEditing(task);
              setModel(task.model);
              setTemperature(String(task.temperature));
              setEnabled(task.enabled);
            }}
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
        title="Modelos LLM"
        description="Asigna el modelo OpenRouter (u otro proveedor) por tipo de tarea de IA."
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
        title={editing ? `Modelo: ${editing.label}` : 'Modelo LLM'}
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
          <InputText
            label="Modelo (OpenRouter ID)"
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
            La API key sigue en variables de entorno (`AI_API_KEY`). Aquí solo configuras qué
            modelo usa cada tarea.
          </p>
        </div>
      </Dialog>
    </DashboardShell>
  );
}
