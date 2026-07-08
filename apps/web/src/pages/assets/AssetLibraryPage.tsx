import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Download, Eye, FolderInput, FolderTree, Grid3X3, LayoutList, Trash2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AssetFolderTree, type FolderSelection } from '@/components/assets/AssetFolderTree';
import { AssetGridCard } from '@/components/assets/AssetGridCard';
import { AssetPreviewDialog } from '@/components/assets/AssetPreviewDialog';
import { AssetUploader } from '@/components/assets/AssetUploader';
import { IconButton, ACTION_BUTTON_GROUP_CLASS } from '@/components/atoms/IconButton';
import { Button } from '@/components/atoms/Button';
import { Checkbox } from '@/components/atoms/Checkbox';
import { StatusPill } from '@/components/atoms/StatusPill';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Dialog } from '@/components/molecules/Dialog';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  createAssetFolder,
  deleteAsset,
  deleteAssetFolder,
  duplicateAsset,
  getAssetDownloadUrl,
  listAssetFolders,
  listAssets,
  updateAsset,
  updateAssetFolder,
} from '@/services/assets';
import { listFoldersByPath, resolveFolderPath } from '@/lib/asset-folder-tree';
import { ASSET_TYPE_LABELS, type Asset, type AssetType } from '@/types/assets';

type ViewMode = 'grid' | 'table';

const filterSelectClass =
  'h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAssetLocked(asset: Asset) {
  return asset.isInUse || asset.referenceCount > 0;
}

function toggleSelection(ids: Set<string>, assetId: string, checked: boolean): Set<string> {
  const next = new Set(ids);
  if (checked) {
    next.add(assetId);
  } else {
    next.delete(assetId);
  }
  return next;
}

function toggleSectionSelection(ids: Set<string>, assets: Asset[], checked: boolean): Set<string> {
  const next = new Set(ids);
  for (const asset of assets) {
    if (checked) {
      next.add(asset.id);
    } else {
      next.delete(asset.id);
    }
  }
  return next;
}

function sectionSelectionState(ids: Set<string>, assets: Asset[]) {
  if (assets.length === 0) {
    return false;
  }
  const selectedCount = assets.filter((asset) => ids.has(asset.id)).length;
  if (selectedCount === 0) {
    return false;
  }
  if (selectedCount === assets.length) {
    return true;
  }
  return 'indeterminate' as const;
}

function folderQueryParams(folderFilter: FolderSelection) {
  if (folderFilter === '__unfiled__') {
    return { unfiled: true as const };
  }
  if (folderFilter) {
    return { folderId: folderFilter };
  }
  return {};
}

type AssetSectionProps = {
  title: string;
  subtitle: string;
  assets: Asset[];
  selectedIds: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  onPreview: (asset: Asset) => void;
  onDownload: (asset: Asset) => void;
  onDuplicate: (assetId: string) => void;
  onDelete: (assetId: string) => void;
};

function AssetSection({
  title,
  subtitle,
  assets,
  selectedIds,
  onSelectionChange,
  onPreview,
  onDownload,
  onDuplicate,
  onDelete,
}: AssetSectionProps) {
  const sectionState = sectionSelectionState(selectedIds, assets);

  return (
    <Card title={title} subtitle={subtitle}>
      <div className="mb-3 flex items-center gap-2">
        <Checkbox
          checked={sectionState}
          onChange={(checked) => onSelectionChange(toggleSectionSelection(selectedIds, assets, checked))}
          label="Seleccionar todos"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {assets.map((asset) => (
          <AssetGridCard
            key={asset.id}
            asset={asset}
            selected={selectedIds.has(asset.id)}
            locked={isAssetLocked(asset)}
            onSelectToggle={(checked) =>
              onSelectionChange(toggleSelection(selectedIds, asset.id, checked))
            }
            onOpenPreview={() => onPreview(asset)}
            onDownload={() => onDownload(asset)}
            onDuplicate={() => onDuplicate(asset.id)}
            onDelete={() => onDelete(asset.id)}
          />
        ))}
      </div>
    </Card>
  );
}

export default function AssetLibraryPage() {
  const queryClient = useQueryClient();
  const [folderFilter, setFolderFilter] = useState<FolderSelection>('');
  const [typeFilter, setTypeFilter] = useState<'' | AssetType>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [moveTargetFolder, setMoveTargetFolder] = useState<string>('');
  const [folderOrganizerOpen, setFolderOrganizerOpen] = useState(false);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [folderFilter, typeFilter]);

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
        type: typeFilter || undefined,
        ...folderQueryParams(folderFilter),
      }),
  });

  const invalidateAssets = () => {
    void queryClient.invalidateQueries({ queryKey: ['assets'] });
  };

  const invalidateFolders = () => {
    void queryClient.invalidateQueries({ queryKey: ['asset-folders'] });
  };

  const createFolderMutation = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      createAssetFolder(name, parentId),
    onSuccess: (folder) => {
      invalidateFolders();
      setFolderFilter(folder.id);
      toast.success('Carpeta creada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo crear la carpeta');
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateAssetFolder(id, { name }),
    onSuccess: () => {
      invalidateFolders();
      toast.message('Carpeta renombrada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo renombrar');
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: deleteAssetFolder,
    onSuccess: () => {
      invalidateFolders();
      setFolderFilter('');
      toast.message('Carpeta eliminada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'La carpeta debe estar vacía');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      invalidateAssets();
      toast.message('Activo eliminado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => deleteAsset(id)));
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (failed > 0) {
        throw new Error(`No se pudieron eliminar ${failed} archivo(s)`);
      }
    },
    onSuccess: (_data, ids) => {
      invalidateAssets();
      setSelectedIds((current) => {
        const next = new Set(current);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      toast.message(ids.length === 1 ? 'Activo eliminado' : `${ids.length} activos eliminados`);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'No se pudo eliminar la selección';
      toast.error(message);
      invalidateAssets();
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ ids, folderId }: { ids: string[]; folderId: string | null }) => {
      await Promise.all(ids.map((id) => updateAsset(id, { folderId })));
    },
    onSuccess: (_data, { ids }) => {
      invalidateAssets();
      setSelectedIds(new Set());
      setMoveTargetFolder('');
      toast.success(ids.length === 1 ? 'Activo movido' : `${ids.length} activos movidos`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo mover');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateAsset,
    onSuccess: () => {
      invalidateAssets();
      toast.success('Activo duplicado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo duplicar');
    },
  });

  const folderMutationsBusy =
    createFolderMutation.isPending ||
    renameFolderMutation.isPending ||
    deleteFolderMutation.isPending;

  const folders = foldersQuery.data?.items ?? [];
  const folderOptions = useMemo(() => listFoldersByPath(folders), [folders]);
  const items = assetsQuery.data?.items ?? [];
  const imagesOnly = items.filter((a) => a.type === 'image');
  const otherAssets = items.filter((a) => a.type !== 'image');
  const currentFolderLabel =
    folderFilter === '__unfiled__'
      ? 'Sin carpeta'
      : folderFilter
        ? resolveFolderPath(folders, folderFilter) ?? 'Carpeta'
        : 'Todas las carpetas';

  const selectedAssets = items.filter((asset) => selectedIds.has(asset.id));
  const deletableSelected = selectedAssets.filter((asset) => !isAssetLocked(asset));
  const lockedSelectedCount = selectedAssets.length - deletableSelected.length;

  const handleDownload = async (asset: Asset) => {
    const { url } = await getAssetDownloadUrl(asset.id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleBulkDelete = () => {
    if (deletableSelected.length === 0) {
      toast.error('Los activos seleccionados están en uso y no se pueden eliminar');
      return;
    }
    bulkDeleteMutation.mutate(deletableSelected.map((asset) => asset.id));
  };

  const handleMoveSelected = () => {
    if (!selectedIds.size) {
      return;
    }
    const folderId = moveTargetFolder === '__root__' ? null : moveTargetFolder || null;
    moveMutation.mutate({ ids: [...selectedIds], folderId });
  };

  const handleDeleteFolder = (folderId: string) => {
    const folderName = folders.find((folder) => folder.id === folderId)?.name ?? 'esta carpeta';
    if (!window.confirm(`¿Eliminar "${folderName}"? Debe estar vacía (sin archivos ni subcarpetas).`)) {
      return;
    }
    deleteFolderMutation.mutate(folderId);
  };

  const columns: DataTableColumn[] = useMemo(
    () => [
      { field: 'name', header: 'Nombre', sortable: true },
      {
        field: 'folder',
        header: 'Carpeta',
        body: (row) => resolveFolderPath(folders, (row as Asset).folderId) ?? '—',
      },
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
          if (isAssetLocked(asset)) {
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
          const locked = isAssetLocked(asset);
          return (
            <div className={ACTION_BUTTON_GROUP_CLASS}>
              <IconButton type="button" label="Ver" onClick={() => setPreviewAsset(asset)}>
                <Eye />
              </IconButton>
              <IconButton
                type="button"
                label="Descargar"
                onClick={() => void handleDownload(asset)}
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
    [deleteMutation.isPending, duplicateMutation.isPending, folders],
  );

  const uploadFolderId =
    folderFilter && folderFilter !== '__unfiled__' ? folderFilter : undefined;

  const handleFolderSelect = (folderId: FolderSelection) => {
    setFolderFilter(folderId);
    setFolderOrganizerOpen(false);
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Librería multimedia"
        description="Organiza capturas y medios en carpetas. El copiloto CM usa PC / iPad / iOS al generar posts."
      />

      <div className="space-y-6">
        <div className="sticky top-0 z-20 -mx-[var(--spacing-md)] border-b border-[var(--border)] bg-[var(--background)]/95 px-[var(--spacing-md)] py-3 backdrop-blur-sm lg:-mx-0 lg:rounded-[var(--radius-lg)] lg:border lg:px-0 lg:py-0 lg:backdrop-blur-none">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex min-w-[200px] flex-1 flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--foreground-muted)]">Carpeta</label>
                  <div className="flex gap-2">
                    <select
                      className={`${filterSelectClass} min-w-0 flex-1`}
                      value={folderFilter}
                      onChange={(e) => setFolderFilter(e.target.value as FolderSelection)}
                      aria-label="Carpeta activa"
                    >
                      <option value="">Todas las carpetas</option>
                      <option value="__unfiled__">Sin carpeta</option>
                      {folderOptions.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.path}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5"
                      onClick={() => setFolderOrganizerOpen(true)}
                    >
                      <FolderTree className="h-4 w-4" />
                      Organizar
                    </Button>
                  </div>
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

            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
              <AssetUploader
                folderId={uploadFolderId}
                onUploaded={() => {
                  invalidateAssets();
                }}
              />
            </Card>
          </div>
        </div>

        {selectedIds.size > 0 && (
            <Card className="border-[var(--primary)]/40 bg-[var(--primary)]/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {selectedIds.size} seleccionado(s)
                  {lockedSelectedCount > 0 &&
                    ` · ${lockedSelectedCount} en uso (no se eliminarán)`}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className={filterSelectClass}
                    value={moveTargetFolder}
                    onChange={(event) => setMoveTargetFolder(event.target.value)}
                    aria-label="Mover a carpeta"
                  >
                    <option value="">Mover a…</option>
                    <option value="__root__">Sin carpeta</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {resolveFolderPath(folders, folder.id)}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2"
                    disabled={!moveTargetFolder || moveMutation.isPending}
                    onClick={handleMoveSelected}
                  >
                    <FolderInput className="h-4 w-4" />
                    Mover
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                    Deseleccionar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="gap-2"
                    disabled={deletableSelected.length === 0 || bulkDeleteMutation.isPending}
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar ({deletableSelected.length})
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {viewMode === 'grid' ? (
            assetsQuery.isLoading ? (
              <div className="py-16 text-center text-[var(--foreground-muted)]">Cargando...</div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-[var(--foreground-muted)]">
                No hay activos en {currentFolderLabel.toLowerCase()}
              </div>
            ) : (
              <div className="space-y-6">
                {imagesOnly.length > 0 && (
                  <AssetSection
                    title="Imágenes"
                    subtitle={`${imagesOnly.length} archivos`}
                    assets={imagesOnly}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onPreview={setPreviewAsset}
                    onDownload={(asset) => void handleDownload(asset)}
                    onDuplicate={(assetId) => duplicateMutation.mutate(assetId)}
                    onDelete={(assetId) => deleteMutation.mutate(assetId)}
                  />
                )}

                {otherAssets.length > 0 && (
                  <AssetSection
                    title="Otros activos"
                    subtitle="Documentos, videos, audio"
                    assets={otherAssets}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onPreview={setPreviewAsset}
                    onDownload={(asset) => void handleDownload(asset)}
                    onDuplicate={(assetId) => duplicateMutation.mutate(assetId)}
                    onDelete={(assetId) => deleteMutation.mutate(assetId)}
                  />
                )}
              </div>
            )
          ) : (
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
      </div>

      <Dialog
        visible={folderOrganizerOpen}
        onHide={() => setFolderOrganizerOpen(false)}
        title="Organizar carpetas"
        description="Crea subcarpetas PC, iPad o iOS. Al elegir una, vuelves a la librería filtrada."
        size="md"
      >
        <AssetFolderTree
          folders={folders}
          selectedId={folderFilter}
          onSelect={handleFolderSelect}
          onCreate={(name, parentId) => createFolderMutation.mutate({ name, parentId })}
          onRename={(id, name) => renameFolderMutation.mutate({ id, name })}
          onDelete={handleDeleteFolder}
          isBusy={folderMutationsBusy}
        />
      </Dialog>

      <AssetPreviewDialog
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
        onDownload={(asset) => void handleDownload(asset)}
      />
    </DashboardShell>
  );
}
