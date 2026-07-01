import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Download, Grid3X3, ImageIcon, LayoutList, Trash2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AssetUploader } from '@/components/assets/AssetUploader';
import { AuthenticatedAssetImage } from '@/components/assets/AuthenticatedAssetImage';
import { IconButton, ACTION_BUTTON_GROUP_CLASS } from '@/components/atoms/IconButton';
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

type ViewMode = 'grid' | 'table';

const filterSelectClass =
  'h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetThumbnail({ asset }: { asset: Asset }) {
  if (asset.type === 'image') {
    return (
      <div className="aspect-square overflow-hidden rounded-lg bg-[var(--background-secondary)]">
        <AuthenticatedAssetImage
          assetId={asset.id}
          fallbackUrl={asset.url}
          title={asset.name}
          className="h-full w-full object-cover transition-transform hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-square items-center justify-center rounded-lg bg-[var(--background-secondary)]">
      <div className="flex flex-col items-center gap-1 text-[var(--foreground-muted)]">
        <ImageIcon className="h-8 w-8" />
        <span className="text-[10px] font-medium">{ASSET_TYPE_LABELS[asset.type]}</span>
      </div>
    </div>
  );
}

export default function AssetLibraryPage() {
  const queryClient = useQueryClient();
  const [folderFilter, setFolderFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | AssetType>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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
  const imagesOnly = items.filter((a) => a.type === 'image');

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
            <div className={ACTION_BUTTON_GROUP_CLASS}>
              <IconButton
                type="button"
                label="Descargar"
                onClick={async () => {
                  const { url } = await getAssetDownloadUrl(asset.id);
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
              >
                <Download />
              </IconButton>
              <IconButton
                type="button"
                label="Duplicar"
                loading={duplicateMutation.isPending}
                onClick={() => duplicateMutation.mutate(asset.id)}
              >
                <Copy />
              </IconButton>
              <IconButton
                type="button"
                tone="destructive"
                label="Eliminar"
                disabled={locked}
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(asset.id)}
              >
                <Trash2 />
              </IconButton>
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
          <div className="flex flex-wrap items-end gap-3">
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

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--foreground-muted)]">Vista</label>
              <div className="flex">
                <button
                  type="button"
                  className={`flex h-10 items-center gap-1 rounded-l-[var(--radius)] border px-3 text-sm transition-colors ${
                    viewMode === 'grid'
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                      : 'border-[var(--border)] bg-[var(--input)] text-[var(--foreground-muted)]'
                  }`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                  Grid
                </button>
                <button
                  type="button"
                  className={`flex h-10 items-center gap-1 rounded-r-[var(--radius)] border px-3 text-sm transition-colors ${
                    viewMode === 'table'
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                      : 'border-[var(--border)] bg-[var(--input)] text-[var(--foreground-muted)]'
                  }`}
                  onClick={() => setViewMode('table')}
                >
                  <LayoutList className="h-4 w-4" />
                  Tabla
                </button>
              </div>
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

      {/* Grid view */}
      {viewMode === 'grid' ? (
        assetsQuery.isLoading ? (
          <div className="py-16 text-center text-[var(--foreground-muted)]">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-[var(--foreground-muted)]">
            No hay activos en la librería
          </div>
        ) : (
          <div className="space-y-6">
            {/* Images grid */}
            {imagesOnly.length > 0 && (
              <Card title="Imágenes" subtitle={`${imagesOnly.length} archivos`}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {imagesOnly.map((asset) => (
                    <AssetGridCard
                      key={asset.id}
                      asset={asset}
                      onDownload={async () => {
                        const { url } = await getAssetDownloadUrl(asset.id);
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      onDuplicate={() => duplicateMutation.mutate(asset.id)}
                      onDelete={() => deleteMutation.mutate(asset.id)}
                      locked={asset.isInUse || asset.referenceCount > 0}
                    />
                  ))}
                </div>
              </Card>
            )}

            {/* Other assets */}
            {items.filter((a) => a.type !== 'image').length > 0 && (
              <Card title="Otros activos" subtitle="Documentos, videos, audio">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {items
                    .filter((a) => a.type !== 'image')
                    .map((asset) => (
                      <AssetGridCard
                        key={asset.id}
                        asset={asset}
                        onDownload={async () => {
                          const { url } = await getAssetDownloadUrl(asset.id);
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        onDuplicate={() => duplicateMutation.mutate(asset.id)}
                        onDelete={() => deleteMutation.mutate(asset.id)}
                        locked={asset.isInUse || asset.referenceCount > 0}
                      />
                    ))}
                </div>
              </Card>
            )}
          </div>
        )
      ) : (
        /* Table view */
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
      )}
    </DashboardShell>
  );
}

function AssetGridCard({
  asset,
  onDownload,
  onDuplicate,
  onDelete,
  locked,
}: {
  asset: Asset;
  onDownload: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  locked: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition-all hover:shadow-md">
      <AssetThumbnail asset={asset} />

      {/* Actions overlay on hover */}
      <div className={`absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 ${ACTION_BUTTON_GROUP_CLASS}`}>
        <IconButton type="button" label="Descargar" onClick={onDownload}>
          <Download />
        </IconButton>
        <IconButton type="button" label="Duplicar" onClick={onDuplicate}>
          <Copy />
        </IconButton>
        <IconButton type="button" tone="destructive" label="Eliminar" disabled={locked} onClick={onDelete}>
          <Trash2 />
        </IconButton>
      </div>

      <div className="border-t border-[var(--border)] p-2.5">
        <p className="truncate text-xs font-medium text-[var(--foreground)]">{asset.name}</p>
        <p className="text-[10px] text-[var(--foreground-subtle)]">
          {formatSize(asset.fileSize)}
          {asset.referenceCount > 0 && ` · ${asset.referenceCount} refs`}
        </p>
        {asset.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {asset.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-[var(--secondary)] px-1.5 py-0.5 text-[9px] text-[var(--foreground-muted)]"
              >
                {tag.name}
              </span>
            ))}
            {asset.tags.length > 2 && (
              <span className="text-[9px] text-[var(--foreground-subtle)]">
                +{asset.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}