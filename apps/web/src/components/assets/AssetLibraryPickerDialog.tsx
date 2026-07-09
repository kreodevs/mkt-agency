import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImageIcon } from 'lucide-react';
import { Dialog } from '@/components/molecules/Dialog';
import {
  ASSETS_PAGE_SIZE,
  AssetLibraryPagination,
} from '@/components/assets/AssetLibraryPagination';
import { AssetFolderTree, type FolderSelection } from '@/components/assets/AssetFolderTree';
import { listAssetFolders, listAssets, resolveAssetPreviewUrl } from '@/services/assets';
import type { Asset, AssetType } from '@/types/assets';
import { resolveFolderPath } from '@/lib/asset-folder-tree';

type AssetLibraryPickerDialogProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
  title?: string;
  description?: string;
  typeFilter?: AssetType;
  isPending?: boolean;
};

export function AssetLibraryPickerDialog({
  visible,
  onClose,
  onSelect,
  title = 'Elegir desde librería',
  description = 'Selecciona un archivo de tus carpetas.',
  typeFilter,
  isPending,
}: AssetLibraryPickerDialogProps) {
  const [folderId, setFolderId] = useState<FolderSelection>('');
  const [page, setPage] = useState(1);

  const foldersQuery = useQuery({
    queryKey: ['asset-folders'],
    queryFn: listAssetFolders,
    enabled: visible,
  });

  const assetsQuery = useQuery({
    queryKey: ['assets-picker', { folderId, typeFilter, page }],
    queryFn: () =>
      listAssets({
        page,
        limit: ASSETS_PAGE_SIZE,
        type: typeFilter,
        folderId: folderId && folderId !== '__unfiled__' ? folderId : undefined,
        unfiled: folderId === '__unfiled__' ? true : undefined,
      }),
    enabled: visible,
  });

  const folders = foldersQuery.data?.items ?? [];
  const items = assetsQuery.data?.items ?? [];
  const totalAssets = assetsQuery.data?.total ?? 0;

  const handleFolderSelect = (next: FolderSelection) => {
    setFolderId(next);
    setPage(1);
  };

  return (
    <Dialog visible={visible} onHide={onClose} title={title} description={description} size="xl">
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
          <AssetFolderTree
            folders={folders}
            selectedId={folderId}
            onSelect={handleFolderSelect}
            onCreate={() => {}}
            onRename={() => {}}
            onDelete={() => {}}
            readOnly
          />
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          {assetsQuery.isLoading ? (
            <p className="text-sm text-[var(--foreground-muted)]">Cargando archivos...</p>
          ) : items.length ? (
            <>
              <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
                {items.map((asset) => {
                const preview = resolveAssetPreviewUrl(asset);
                const folderPath = resolveFolderPath(folders, asset.folderId);
                return (
                  <button
                    key={asset.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => onSelect(asset)}
                    className="group overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] text-left transition hover:border-[var(--primary)]"
                  >
                    {preview && asset.type === 'image' ? (
                      <img
                        src={preview}
                        alt={asset.name}
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-[var(--secondary)]">
                        <ImageIcon className="h-8 w-8 text-[var(--foreground-muted)]" />
                      </div>
                    )}
                    <div className="px-2 py-1.5">
                      <p className="truncate text-xs font-medium text-[var(--foreground)]">
                        {asset.name}
                      </p>
                      {folderPath && (
                        <p className="truncate text-[10px] text-[var(--foreground-subtle)]">
                          {folderPath}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
              </div>
              <AssetLibraryPagination
                page={page}
                limit={ASSETS_PAGE_SIZE}
                total={totalAssets}
                onPageChange={setPage}
              />
            </>
          ) : (
            <p className="text-sm text-[var(--foreground-muted)]">
              No hay archivos en esta carpeta. Sube capturas en Librería → PC / iPad / iOS.
            </p>
          )}
        </div>
      </div>
    </Dialog>
  );
}
