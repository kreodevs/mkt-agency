import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Download, Trash2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AssetUploader } from '@/components/assets/AssetUploader';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  deleteAsset,
  duplicateAsset,
  getAssetDownloadUrl,
  listAssetFolders,
  listAssets,
} from '@/services/assets';
import { ASSET_TYPE_LABELS, type Asset, type AssetType } from '@/types/assets';

const filterSelectClass =
  'h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AssetLibraryPage() {
  const queryClient = useQueryClient();
  const [folderFilter, setFolderFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | AssetType>('');

  const foldersQuery = useQuery({
    queryKey: ['asset-folders'],
    queryFn: listAssetFolders,
  });

  const assetsQuery = useQuery({
    queryKey: ['assets', { folderFilter, typeFilter }],
    queryFn: () =>
      listAssets({
        page: 1,
        limit: 100,
        folderId: folderFilter || undefined,
        type: typeFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.message('Activo eliminado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateAsset,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Activo duplicado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo duplicar');
    },
  });

  const items = assetsQuery.data?.items ?? [];

  const columns: DataTableColumn[] = useMemo(
    () => [
      { field: 'name', header: 'Nombre', sortable: true },
      {
        field: 'type',
        header: 'Tipo',
        body: (row) => ASSET_TYPE_LABELS[(row as Asset).type] ?? (row as Asset).type,
      },
      {
        field: 'fileSize',
        header: 'Tamaño',
        body: (row) => formatSize((row as Asset).fileSize),
      },
      {
        field: 'tags',
        header: 'Etiquetas',
        body: (row) => (row as Asset).tags.map((tag) => tag.name).join(', ') || '—',
      },
      {
        field: 'status',
        header: 'Estado',
        body: (row) => {
          const asset = row as Asset;
          if (asset.isInUse || asset.referenceCount > 0) {
            return (
              <StatusPill status="warning" size="sm">
                En uso
              </StatusPill>
            );
          }
          return (
            <StatusPill status="success" size="sm">
              Libre
            </StatusPill>
          );
        },
      },
      {
        field: 'actions',
        header: '',
        body: (row) => {
          const asset = row as Asset;
          const locked = asset.isInUse || asset.referenceCount > 0;
          return (
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const { url } = await getAssetDownloadUrl(asset.id);
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                loading={duplicateMutation.isPending}
                onClick={() => duplicateMutation.mutate(asset.id)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={locked}
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(asset.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [deleteMutation.isPending, duplicateMutation.isPending],
  );

  return (
    <DashboardShell>
      <PageHeader
        title="Librería multimedia"
        description="Sube, organiza y descarga activos del tenant"
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--foreground-muted)]">Carpeta</label>
              <select
                className={filterSelectClass}
                value={folderFilter}
                onChange={(e) => setFolderFilter(e.target.value)}
              >
                <option value="">Todas</option>
                {(foldersQuery.data?.items ?? []).map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--foreground-muted)]">Tipo</label>
              <select
                className={filterSelectClass}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as '' | AssetType)}
              >
                <option value="">Todos</option>
                {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <AssetUploader
            folderId={folderFilter || undefined}
            onUploaded={() => void queryClient.invalidateQueries({ queryKey: ['assets'] })}
          />
        </Card>
      </div>

      <Card>
        <DataTable
          data={items}
          columns={columns}
          loading={assetsQuery.isLoading}
          emptyMessage="No hay activos en la librería"
          paginator
          rows={20}
        />
      </Card>
    </DashboardShell>
  );
}
