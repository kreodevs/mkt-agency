import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Code2, Plus, Trash2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { IconButton, ACTION_BUTTON_GROUP_CLASS } from '@/components/atoms/IconButton';
import { InputText } from '@/components/atoms/InputText';
import { FormSnippet } from '@/components/forms/FormSnippet';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { DataTable } from '@/components/organisms/DataTable';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { createForm, deleteForm, getFormSnippet, listForms, updateForm } from '@/services/forms';
import { listProducts } from '@/services/products';
import { DEFAULT_FORM_FIELDS } from '@/types/forms';
import type { DataTableColumn } from '@/components/organisms/DataTable';

const selectClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

export default function FormListPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newProductId, setNewProductId] = useState('');

  const formsQuery = useQuery({
    queryKey: ['forms'],
    queryFn: () => listForms(),
  });

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => listProducts({ status: 'active', limit: 100 }),
  });

  const products = productsQuery.data?.items ?? [];
  const productNameById = useMemo(
    () => new Map(products.map((p) => [p.id, p.name])),
    [products],
  );

  const selectedForm = formsQuery.data?.items.find((f) => f.id === selectedId);

  useEffect(() => {
    if (!newProductId && products.length > 0) {
      const primary = products.find((p) => p.isPrimary) ?? products[0];
      setNewProductId(primary.id);
    }
  }, [products, newProductId]);

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
        productId: newProductId || null,
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

  const updateProductMutation = useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string | null }) =>
      updateForm(id, { productId }),
    onSuccess: (form) => {
      void queryClient.invalidateQueries({ queryKey: ['forms'] });
      void queryClient.invalidateQueries({ queryKey: ['form-snippet', form.id] });
      toast.success('Producto asignado al formulario');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo actualizar');
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
      field: 'productId',
      header: 'Producto',
      body: (row) => {
        const productId = (row as { productId?: string | null }).productId;
        return productId ? (productNameById.get(productId) ?? '—') : 'Sin producto';
      },
    },
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
          <div className={ACTION_BUTTON_GROUP_CLASS}>
            <IconButton
              type="button"
              tone={selectedId === id ? 'selected' : 'default'}
              label="Ver snippet"
              onClick={() => setSelectedId(id)}
            >
              <Code2 />
            </IconButton>
            <IconButton
              type="button"
              tone="destructive"
              label="Eliminar formulario"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(id)}
            >
              <Trash2 />
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
        description="Captura leads desde tu sitio web con snippet JS — asócialos a un producto"
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <InputText
              label="Nuevo formulario"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del formulario"
            />
            <div className="min-w-[180px]">
              <label className="mb-1 block text-xs font-medium text-[var(--foreground-muted)]">
                Producto
              </label>
              <select
                className={selectClass}
                value={newProductId}
                onChange={(e) => setNewProductId(e.target.value)}
              >
                <option value="">Sin producto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
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

        <div className="space-y-4 lg:col-span-2">
          {selectedForm && (
            <Card title="Producto del formulario">
              <p className="mb-3 text-xs text-[var(--foreground-muted)]">
                Los leads capturados heredarán este producto automáticamente.
              </p>
              <select
                className={selectClass}
                value={selectedForm.productId ?? ''}
                disabled={updateProductMutation.isPending}
                onChange={(e) => {
                  const productId = e.target.value || null;
                  updateProductMutation.mutate({ id: selectedForm.id, productId });
                }}
              >
                <option value="">Sin producto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Card>
          )}
          <FormSnippet snippet={snippetQuery.data} loading={snippetQuery.isLoading} />
        </div>
      </div>
    </DashboardShell>
  );
}
