import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DashboardShell, superadminNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { Dialog } from '@/components/molecules/Dialog';
import { InputText } from '@/components/atoms/InputText';
import { Password } from '@/components/atoms/Password';
import { StatusPill } from '@/components/atoms/StatusPill';
import { LlmModelSelect } from '@/components/admin/LlmModelSelect';
import { toast } from '@/components/molecules/Sonner';
import {
  createLlmProvider,
  deleteLlmProvider,
  listLlmProviders,
  updateLlmProvider,
  type LlmProvider,
} from '@/services/superadmin';
import { ApiError } from '@/services/api';

export default function LlmProvidersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LlmProvider | null>(null);
  const [form, setForm] = useState({
    slug: '',
    name: '',
    apiUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    defaultModel: '',
    isActive: true,
  });

  const providersQuery = useQuery({
    queryKey: ['llm-providers'],
    queryFn: () => listLlmProviders(true),
  });

  const showModelSelect =
    dialogOpen && !!editing?.apiKeyConfigured && !form.apiKey.trim();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: form.slug.trim(),
        name: form.name.trim(),
        apiUrl: form.apiUrl.trim(),
        defaultModel: form.defaultModel.trim() || undefined,
        apiKey: form.apiKey.trim() || undefined,
        isActive: form.isActive,
      };

      if (editing) {
        return updateLlmProvider(editing.id, {
          name: payload.name,
          apiUrl: payload.apiUrl,
          defaultModel: payload.defaultModel ?? null,
          isActive: payload.isActive,
          ...(form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}),
        });
      }

      return createLlmProvider(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-providers'] });
      queryClient.invalidateQueries({ queryKey: ['llm-provider-models'] });
      setDialogOpen(false);
      toast.success(editing ? 'Proveedor actualizado' : 'Proveedor creado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al guardar proveedor');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLlmProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-providers'] });
      toast.success('Proveedor eliminado');
    },
    onError: () => toast.error('No se pudo eliminar el proveedor'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      slug: '',
      name: '',
      apiUrl: 'https://openrouter.ai/api/v1',
      apiKey: '',
      defaultModel: '',
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (provider: LlmProvider) => {
    setEditing(provider);
    setForm({
      slug: provider.slug,
      name: provider.name,
      apiUrl: provider.apiUrl,
      apiKey: '',
      defaultModel: provider.defaultModel ?? '',
      isActive: provider.isActive,
    });
    setDialogOpen(true);
  };

  const columns: DataTableColumn[] = [
    { field: 'name', header: 'Nombre' },
    { field: 'slug', header: 'Slug' },
    { field: 'apiUrl', header: 'API URL' },
    {
      field: 'defaultModel',
      header: 'Modelo default',
      body: (row) => (row as LlmProvider).defaultModel ?? '—',
    },
    {
      field: 'apiKey',
      header: 'API Key',
      body: (row) => {
        const p = row as LlmProvider;
        return p.apiKeyConfigured ? (
          <span className="font-mono text-xs">{p.apiKeyHint}</span>
        ) : (
          <span className="text-xs text-[var(--destructive)]">Sin configurar</span>
        );
      },
    },
    {
      field: 'isActive',
      header: 'Estado',
      body: (row) => (
        <StatusPill status={(row as LlmProvider).isActive ? 'success' : 'neutral'}>
          {(row as LlmProvider).isActive ? 'Activo' : 'Inactivo'}
        </StatusPill>
      ),
    },
    {
      field: 'actions',
      header: '',
      body: (row) => {
        const provider = row as LlmProvider;
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => openEdit(provider)}>
              Editar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-[var(--destructive)]"
              onClick={() => deleteMutation.mutate(provider.id)}
            >
              Eliminar
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardShell navigationOverride={superadminNavigation}>
      <PageHeader
        title="Proveedores LLM"
        description="Varios proveedores pueden estar activos a la vez. Cada tarea LLM elige su proveedor y modelo."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo proveedor
          </Button>
        }
      />

      <Card className="mt-6">
        <DataTable
          columns={columns}
          data={providersQuery.data ?? []}
          loading={providersQuery.isLoading}
        />
      </Card>

      <Dialog
        visible={dialogOpen}
        onHide={() => setDialogOpen(false)}
        title={editing ? 'Editar proveedor' : 'Nuevo proveedor'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputText
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
          />
          <InputText
            label="Slug"
            value={form.slug}
            disabled={!!editing}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            fullWidth
          />
          <div className="md:col-span-2">
            <InputText
              label="API URL"
              value={form.apiUrl}
              onChange={(e) => setForm((f) => ({ ...f, apiUrl: e.target.value }))}
              placeholder="https://openrouter.ai/api/v1"
              fullWidth
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">API Key</label>
            <Password
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder={editing?.apiKeyConfigured ? 'Dejar vacío para no cambiar' : 'sk-...'}
            />
          </div>

          <div className="md:col-span-2">
            {showModelSelect ? (
              <LlmModelSelect
                providerId={editing!.id}
                value={form.defaultModel}
                onChange={(modelId) => setForm((f) => ({ ...f, defaultModel: modelId }))}
                enabled={dialogOpen && !!editing?.apiKeyConfigured}
              />
            ) : (
              <>
                <label className="mb-1 block text-sm font-medium">Modelo por defecto</label>
                <InputText
                  value={form.defaultModel}
                  onChange={(e) => setForm((f) => ({ ...f, defaultModel: e.target.value }))}
                  placeholder="Guarda el proveedor con API key para ver catálogo"
                  fullWidth
                />
              </>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Proveedor activo (puedes activar varios a la vez)
          </label>
        </div>
      </Dialog>
    </DashboardShell>
  );
}
