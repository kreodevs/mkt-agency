import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AssetBulkSelectionBar } from '@/components/assets/AssetBulkSelectionBar';
import { AssetFolderTree, type FolderSelection } from '@/components/assets/AssetFolderTree';
import {
  ASSETS_PAGE_SIZE,
  AssetLibraryPagination,
} from '@/components/assets/AssetLibraryPagination';
import { AssetPreviewDialog } from '@/components/assets/AssetPreviewDialog';
import { IconButton, ACTION_BUTTON_GROUP_CLASS } from '@/components/atoms/IconButton';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Dialog } from '@/components/molecules/Dialog';
import { EmptyState } from '@/components/molecules/EmptyState';
import { AssetGridSkeleton } from '@/components/molecules/PageSkeleton';
import { Button } from '@/components/atoms/Button';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { StatusPill } from '@/components/atoms/StatusPill';
import { toast } from '@/components/molecules/Sonner';
import { listAssetFolders, listAssets, getAssetDownloadUrl } from '@/services/assets';
import { resolveFolderPath } from '@/lib/asset-folder-tree';
import { ASSET_TYPE_LABELS, type Asset, type AssetType } from '@/types/assets';
import { AssetSection, isAssetLocked } from './AssetSection';
import { AssetFilterBar } from './AssetFilterBar';
import { useAssetLibraryMutations } from './useAssetLibraryMutations';
import {
  persistLibraryViewMode,
  readLibraryViewMode,
  type LibraryViewMode,
} from '@/lib/library-view-preference';

type ViewMode = LibraryViewMode;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

export default function AssetLibraryPage() {
  const queryClient = useQueryClient();
  const [folderFilter, setFolderFilter] = useState<FolderSelection>('');
  const [typeFilter, setTypeFilter] = useState<'' | AssetType>('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(() => readLibraryViewMode());
  const [isMobile, setIsMobile] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [moveTargetFolder, setMoveTargetFolder] = useState<string>('');
  const [folderOrganizerOpen, setFolderOrganizerOpen] = useState(false);
  const [folderPendingDelete, setFolderPendingDelete] = useState<{ id: string; name: string } | null>(
    null,
  );

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const effectiveViewMode: ViewMode = isMobile ? 'grid' : viewMode;

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    persistLibraryViewMode(mode);
  };

  useEffect(() => {
    setSelectedIds(new Set());
    setPage(1);
  }, [folderFilter, typeFilter]);

  const invalidateAssets = () => {
    void queryClient.invalidateQueries({ queryKey: ['assets'] });
  };

  const invalidateFolders = () => {
    void queryClient.invalidateQueries({ queryKey: ['asset-folders'] });
  };

  const handleClearSelection = () => setSelectedIds(new Set());

  const {
    createFolderMutation,
    renameFolderMutation,
    deleteFolderMutation,
    deleteMutation,
    bulkDeleteMutation,
    moveMutation,
    duplicateMutation,
    folderMutationsBusy,
  } = useAssetLibraryMutations({
    onInvalidateAssets: invalidateAssets,
    onInvalidateFolders: invalidateFolders,
    onSetFolderFilter: setFolderFilter,
    onClearSelection: handleClearSelection,
  });

  const foldersQuery = useQuery({
    queryKey: ['asset-folders'],
    queryFn: listAssetFolders,
  });

  const assetsQuery = useQuery({
    queryKey: ['assets', { folderFilter, typeFilter, page }],
    queryFn: () =>
      listAssets({
        page,
        limit: ASSETS_PAGE_SIZE,
        type: typeFilter || undefined,
        ...folderQueryParams(folderFilter),
      }),
  });

  const folders = foldersQuery.data?.items ?? [];
  const items = assetsQuery.data?.items ?? [];
  const totalAssets = assetsQuery.data?.total ?? 0;
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
    if (!selectedIds.size) return;
    const folderId = moveTargetFolder === '__root__' ? null : moveTargetFolder || null;
    moveMutation.mutate({ ids: [...selectedIds], folderId });
  };

  const handleDeleteFolder = (folderId: string) => {
    const folderName = folders.find((folder) => folder.id === folderId)?.name ?? 'esta carpeta';
    setFolderPendingDelete({ id: folderId, name: folderName });
  };

  const handleFolderSelect = (folderId: FolderSelection) => {
    setFolderFilter(folderId);
    setFolderOrganizerOpen(false);
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
          return isAssetLocked(asset) ? (
            <StatusPill status="warning" size="sm">En uso</StatusPill>
          ) : (
            <StatusPill status="success" size="sm">Libre</StatusPill>
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
                <EyeIcon />
              </IconButton>
              <IconButton type="button" label="Descargar" onClick={() => void handleDownload(asset)}>
                <DownloadIcon />
              </IconButton>
              <IconButton
                type="button"
                label="Duplicar"
                loading={duplicateMutation.isPending}
                onClick={() => duplicateMutation.mutate(asset.id)}
              >
                <CopyIcon />
              </IconButton>
              <IconButton
                type="button"
                tone="destructive"
                label="Eliminar"
                disabled={locked}
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(asset.id)}
              >
                <TrashIcon />
              </IconButton>
            </div>
          );
        },
      },
    ],
    [deleteMutation.isPending, duplicateMutation.isPending, folders],
  );

  const uploadFolderId = folderFilter && folderFilter !== '__unfiled__' ? folderFilter : undefined;

  const bulkSelectionProps = {
    folders,
    moveTargetFolder,
    onMoveTargetChange: setMoveTargetFolder,
    movePending: moveMutation.isPending,
    deletePending: bulkDeleteMutation.isPending,
  };

  const handleSectionMove = (sectionAssets: Asset[]) => {
    const ids = sectionAssets
      .filter((asset) => selectedIds.has(asset.id))
      .map((asset) => asset.id);
    if (!ids.length || !moveTargetFolder) return;
    const folderId = moveTargetFolder === '__root__' ? null : moveTargetFolder;
    moveMutation.mutate({ ids, folderId });
  };

  const handleSectionBulkDelete = (sectionAssets: Asset[]) => {
    const ids = sectionAssets
      .filter((asset) => selectedIds.has(asset.id) && !isAssetLocked(asset))
      .map((asset) => asset.id);
    if (ids.length) bulkDeleteMutation.mutate(ids);
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Librería multimedia"
        description="Organiza capturas y medios en carpetas. El copiloto CM usa PC / iPad / iOS al generar posts."
      />

      <div className={`space-y-6 ${selectedIds.size > 0 ? 'pb-28' : ''}`}>
        <AssetFilterBar
          folderFilter={folderFilter}
          onFolderFilterChange={setFolderFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          viewMode={effectiveViewMode}
          onViewModeChange={handleViewModeChange}
          folders={folders}
          uploadFolderId={uploadFolderId}
          onUploaded={invalidateAssets}
          onOrganizeOpen={() => setFolderOrganizerOpen(true)}
        />

        {effectiveViewMode === 'grid' ? (
          assetsQuery.isLoading ? (
            <AssetGridSkeleton />
          ) : items.length === 0 ? (
            <EmptyState
              title="Sin activos en esta carpeta"
              description={`No hay archivos en ${currentFolderLabel.toLowerCase()}. Sube imágenes, logos o material del producto.`}
              action={{
                label: 'Ir a Mi producto',
                onClick: () => {
                  window.location.href = '/products';
                },
              }}
            />
          ) : (
            <div className="space-y-6">
              {imagesOnly.length > 0 && (
                <AssetSection
                  title="Imágenes"
                  subtitle={`${imagesOnly.length} en esta página${totalAssets > ASSETS_PAGE_SIZE ? ` · ${totalAssets} en total` : ''}`}
                  assets={imagesOnly}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  onPreview={setPreviewAsset}
                  onDownload={(asset) => void handleDownload(asset)}
                  onDuplicate={(assetId) => duplicateMutation.mutate(assetId)}
                  onDelete={(assetId) => deleteMutation.mutate(assetId)}
                  {...bulkSelectionProps}
                  onMoveSelected={() => handleSectionMove(imagesOnly)}
                  onBulkDelete={() => handleSectionBulkDelete(imagesOnly)}
                />
              )}

              <AssetLibraryPagination
                page={page}
                limit={ASSETS_PAGE_SIZE}
                total={totalAssets}
                onPageChange={setPage}
              />

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
                  {...bulkSelectionProps}
                  onMoveSelected={() => handleSectionMove(otherAssets)}
                  onBulkDelete={() => handleSectionBulkDelete(otherAssets)}
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
              paginator={false}
              globalFilterEnabled={false}
            />
            {!assetsQuery.isLoading && totalAssets > 0 && (
              <div className="mt-4">
                <AssetLibraryPagination
                  page={page}
                  limit={ASSETS_PAGE_SIZE}
                  total={totalAssets}
                  onPageChange={setPage}
                />
              </div>
            )}
          </Card>
        )}
      </div>

      <AssetBulkSelectionBar
        fixed
        selectedCount={selectedIds.size}
        deletableCount={deletableSelected.length}
        lockedCount={lockedSelectedCount}
        folders={folders}
        moveTargetFolder={moveTargetFolder}
        onMoveTargetChange={setMoveTargetFolder}
        onMove={handleMoveSelected}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedIds(new Set())}
        movePending={moveMutation.isPending}
        deletePending={bulkDeleteMutation.isPending}
      />

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

      <Dialog
        visible={folderPendingDelete !== null}
        onHide={() => setFolderPendingDelete(null)}
        title="Eliminar carpeta"
        description={
          folderPendingDelete
            ? `¿Eliminar «${folderPendingDelete.name}»? Debe estar vacía (sin archivos ni subcarpetas).`
            : undefined
        }
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFolderPendingDelete(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={deleteFolderMutation.isPending}
              onClick={() => {
                if (!folderPendingDelete) return;
                deleteFolderMutation.mutate(folderPendingDelete.id, {
                  onSuccess: () => setFolderPendingDelete(null),
                });
              }}
            >
              Eliminar
            </Button>
          </div>
        }
      />

      <AssetPreviewDialog
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
        onDownload={(asset) => void handleDownload(asset)}
      />
    </DashboardShell>
  );
}

function EyeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
