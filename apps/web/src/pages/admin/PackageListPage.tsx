import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { DashboardShell, superadminNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { IconButton, ACTION_BUTTON_GROUP_CLASS } from '@/components/atoms/IconButton';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { Dialog } from '@/components/molecules/Dialog';
import { InputText } from '@/components/atoms/InputText';
import { StatusPill } from '@/components/atoms/StatusPill';
import { toast } from '@/components/molecules/Sonner';
import {
  createPackage,
  deletePackage,
  listPackages,
  updatePackage,
  type Package as PackageType,
} from '@/services/packages';
import { ApiError } from '@/services/api';

function formatBytes(bytes: number) {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}


export default function PackageListPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PackageType | null>(null);
  const [form, setForm] = useState({
    slug: '',
    name: '',
    description: '',
    maxUsers: '5',
    maxAssetsSizeMb: '1024',
    maxFileSizeMb: '10',
    maxCampaigns: '',
    maxAiRequestsPerDay: '',
    isActive: true,
  });

  const packagesQuery = useQuery({
    queryKey: ['packages', { includeInactive: true }],
    queryFn: () => listPackages(true),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: form.slug.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        maxUsers: Number(form.maxUsers),
        maxAssetsSize: Math.round(Number(form.maxAssetsSizeMb) * 1048576),
        maxFileSize: Math.round(Number(form.maxFileSizeMb) * 1048576),
        maxCampaigns: form.maxCampaigns ? Number(form.maxCampaigns) : null,
        maxAiRequestsPerDay: form.maxAiRequestsPerDay
          ? Number(form.maxAiRequestsPerDay)
          : null,
        isActive: form.isActive,
      };

      if (editing) {
        return updatePackage(editing.id, payload);
      }
      return createPackage(payload as Parameters<typeof createPackage>[0]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      setDialogOpen(false);
      toast.success(editing ? 'Paquete actualizado' : 'Paquete creado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al guardar paquete');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Paquete eliminado');
    },
    onError: () => toast.error('No se pudo eliminar el paquete'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      slug: '',
      name: '',
      description: '',
      maxUsers: '5',
      maxAssetsSizeMb: '1024',
      maxFileSizeMb: '10',
      maxCampaigns: '',
      maxAiRequestsPerDay: '',
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (pkg: PackageType) => {
    setEditing(pkg);
    setForm({
      slug: pkg.slug,
      name: pkg.name,
      description: pkg.description ?? '',
      maxUsers: String(pkg.maxUsers),
      maxAssetsSizeMb: String(Math.round(pkg.maxAssetsSize / 1048576)),
      maxFileSizeMb: String(Math.round(pkg.maxFileSize / 1048576)),
      maxCampaigns: pkg.maxCampaigns != null ? String(pkg.maxCampaigns) : '',
      maxAiRequestsPerDay:
        pkg.maxAiRequestsPerDay != null ? String(pkg.maxAiRequestsPerDay) : '',
      isActive: pkg.isActive,
    });
    setDialogOpen(true);
  };

  const columns: DataTableColumn[] = [
    { field: 'name', header: 'Nombre', sortable: true },
    { field: 'slug', header: 'Slug' },
    {
      field: 'limits',
      header: 'Límites',
      body: (row) => {
        const pkg = row as PackageType;
        return (
          <div className="text-xs text-[var(--foreground-muted)]">
            {pkg.maxUsers} usuarios · {formatBytes(pkg.maxAssetsSize)} storage ·{' '}
            {formatBytes(pkg.maxFileSize)}/archivo
          </div>
        );
      },
    },
    {
      field: 'isActive',
      header: 'Estado',
      body: (row) => (
        <StatusPill status={(row as PackageType).isActive ? 'success' : 'neutral'}>
          {(row as PackageType).isActive ? 'Activo' : 'Inactivo'}
        </StatusPill>
      ),
    },
    {
      field: 'actions',
      header: '',
      body: (row) => {
        const pkg = row as PackageType;
        return (
          <div className={ACTION_BUTTON_GROUP_CLASS}>
            <IconButton label="Editar paquete" onClick={() => openEdit(pkg)}>
              <Pencil />
            </IconButton>
            <IconButton tone="destructive" label="Eliminar paquete" onClick={() => deleteMutation.mutate(pkg.id)}>
              <Trash2 />
            </IconButton>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardShell navigationOverride={superadminNavigation}>
      <PageHeader
        title="Paquetes"
        description="Define límites reutilizables para tenants (usuarios, storage, IA, campañas)."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo paquete
          </Button>
        }
      />

      <Card className="mt-6">
        <DataTable
          columns={columns}
          data={packagesQuery.data?.items ?? []}
          loading={packagesQuery.isLoading}
        />
      </Card>

      <Dialog
        visible={dialogOpen}
        onHide={() => setDialogOpen(false)}
        title={editing ? 'Editar paquete' : 'Nuevo paquete'}
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
              label="Descripción"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
            />
          </div>
          <InputText
            label="Máx. usuarios"
            type="number"
            value={form.maxUsers}
            onChange={(e) => setForm((f) => ({ ...f, maxUsers: e.target.value }))}
            fullWidth
          />
          <InputText
            label="Storage total (MB)"
            type="number"
            value={form.maxAssetsSizeMb}
            onChange={(e) => setForm((f) => ({ ...f, maxAssetsSizeMb: e.target.value }))}
            fullWidth
          />
          <InputText
            label="Tamaño máx. archivo (MB)"
            type="number"
            value={form.maxFileSizeMb}
            onChange={(e) => setForm((f) => ({ ...f, maxFileSizeMb: e.target.value }))}
            fullWidth
          />
          <InputText
            label="Máx. campañas (vacío = ilimitado)"
            type="number"
            value={form.maxCampaigns}
            onChange={(e) => setForm((f) => ({ ...f, maxCampaigns: e.target.value }))}
            fullWidth
          />
          <InputText
            label="Peticiones IA / día (vacío = ilimitado)"
            type="number"
            value={form.maxAiRequestsPerDay}
            onChange={(e) => setForm((f) => ({ ...f, maxAiRequestsPerDay: e.target.value }))}
            fullWidth
          />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Paquete activo (visible al crear tenants)
          </label>
        </div>
      </Dialog>
    </DashboardShell>
  );
}
