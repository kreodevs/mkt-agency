import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Code2, Plus, Trash2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { IconButton } from '@/components/atoms/IconButton';
import { InputText } from '@/components/atoms/InputText';
import { FormSnippet } from '@/components/forms/FormSnippet';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { DataTable } from '@/components/organisms/DataTable';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { createForm, deleteForm, getFormSnippet, listForms } from '@/services/forms';
import { DEFAULT_FORM_FIELDS } from '@/types/forms';
import type { DataTableColumn } from '@/components/organisms/DataTable';

export default function FormListPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const formsQuery = useQuery({
    queryKey: ['forms'],
    queryFn: () => listForms(),
  });

  const snippetQuery = useQuery({
    queryKey: ['form-snippet', selectedId],
    queryFn: () => getFormSnippet(selectedId!),
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createForm({
        name: newName.trim(),
        fields: DEFAULT_FORM_FIELDS,
        style: { primaryColor: '#2563eb' },
      }),
    onSuccess: (form) => {
      void queryClient.invalidateQueries({ queryKey: ['forms'] });
      setSelectedId(form.id);
      setNewName('');
      toast.success('Formulario creado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo crear');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteForm(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms'] });
      setSelectedId(null);
      toast.message('Formulario eliminado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar');
    },
  });

  const items = formsQuery.data?.items ?? [];

  const columns: DataTableColumn[] = [
    { field: 'name', header: 'Nombre' },
    {
      field: 'isActive',
      header: 'Estado',
      body: (row) => ((row as { isActive?: boolean }).isActive ? 'Activo' : 'Inactivo'),
    },
    {
      field: 'createdAt',
      header: 'Creado',
      body: (row) =>
        new Date(String((row as { createdAt?: string }).createdAt)).toLocaleDateString('es-ES'),
    },
    {
      field: 'id',
      header: '',
      body: (row) => {
        const id = String((row as { id?: string }).id);
        return (
          <div className="flex items-center gap-1">
            <IconButton
              type="button"
              variant={selectedId === id ? 'default' : 'outline'}
              label="Ver snippet"
              onClick={() => setSelectedId(id)}
            >
              <Code2 className="h-4 w-4" />
            </IconButton>
            <IconButton
              type="button"
              variant="ghost"
              label="Eliminar formulario"
              className="text-[var(--destructive)] hover:text-[var(--destructive)]"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(id)}
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardShell>
      <PageHeader
        title="Formularios embebidos"
        description="Captura leads desde tu sitio web con snippet JS"
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <InputText
              label="Nuevo formulario"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del formulario"
            />
            <Button
              type="button"
              loading={createMutation.isPending}
              disabled={!newName.trim()}
              onClick={() => createMutation.mutate()}
            >
              <Plus className="mr-1 h-4 w-4" />
              Crear
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <DataTable
            data={items}
            loading={formsQuery.isLoading}
            emptyMessage="Aún no hay formularios"
            columns={columns}
          />
        </Card>

        <div className="lg:col-span-2">
          <FormSnippet snippet={snippetQuery.data} loading={snippetQuery.isLoading} />
        </div>
      </div>
    </DashboardShell>
  );
}
