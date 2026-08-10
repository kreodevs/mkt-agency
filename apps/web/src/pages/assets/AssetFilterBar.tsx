import { FolderTree } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { Card } from '@/components/molecules/Card';
import { AssetUploader } from '@/components/assets/AssetUploader';
import { type FolderSelection } from '@/components/assets/AssetFolderTree';
import { ASSET_TYPE_LABELS, type AssetType } from '@/types/assets';
import { listFoldersByPath } from '@/lib/asset-folder-tree';
import { type AssetFolder } from '@/types/assets';

type ViewMode = 'grid' | 'table';

type AssetFilterBarProps = {
  folderFilter: FolderSelection;
  onFolderFilterChange: (value: FolderSelection) => void;
  typeFilter: '' | AssetType;
  onTypeFilterChange: (value: '' | AssetType) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  folders: AssetFolder[];
  uploadFolderId: string | undefined;
  onUploaded: () => void;
  onOrganizeOpen: () => void;
};

export function AssetFilterBar({
  folderFilter,
  onFolderFilterChange,
  typeFilter,
  onTypeFilterChange,
  viewMode,
  onViewModeChange,
  folders,
  uploadFolderId,
  onUploaded,
  onOrganizeOpen,
}: AssetFilterBarProps) {
  const folderOptions = listFoldersByPath(folders);

  return (
    <div className="sticky top-0 z-20 -mx-[var(--spacing-md)] border-b border-[var(--border)] bg-[var(--background)]/95 px-[var(--spacing-md)] py-3 backdrop-blur-sm lg:-mx-0 lg:rounded-[var(--radius-lg)] lg:border lg:px-0 lg:py-0 lg:backdrop-blur-none">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="border-0 shadow-none lg:border lg:shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-[200px] flex-1 gap-2">
                <Select
                  label="Carpeta"
                  className="min-w-0 flex-1"
                  value={folderFilter}
                  onChange={(e) => onFolderFilterChange(e.target.value as FolderSelection)}
                  aria-label="Carpeta activa"
                  options={[
                    { value: '', label: 'Todas las carpetas' },
                    { value: '__unfiled__', label: 'Sin carpeta' },
                    ...folderOptions.map((folder) => ({
                      value: folder.id,
                      label: folder.path,
                    })),
                  ]}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={onOrganizeOpen}
                >
                  <FolderTree className="h-4 w-4" />
                  Organizar
                </Button>
              </div>

            <Select
              label="Tipo"
              fullWidth={false}
              className="min-w-[8rem]"
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value as '' | AssetType)}
              options={[
                { value: '', label: 'Todos' },
                ...Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />

            <div className="hidden flex-col gap-1 sm:flex">
              <label className="text-xs font-medium text-[var(--foreground-muted)]">Vista</label>
              <div className="flex" role="radiogroup" aria-label="Modo de vista">
                <button
                  type="button"
                  role="radio"
                  aria-checked={viewMode === 'grid'}
                  aria-label="Vista en grid"
                  className={`flex h-10 items-center gap-1 rounded-l-[var(--radius)] border px-3 text-sm transition-colors ${
                    viewMode === 'grid'
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                      : 'border-[var(--border)] bg-[var(--input)] text-[var(--foreground-muted)]'
                  }`}
                  onClick={() => onViewModeChange('grid')}
                >
                  <Grid3X3Icon />
                  Grid
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={viewMode === 'table'}
                  aria-label="Vista en tabla"
                  className={`flex h-10 items-center gap-1 rounded-r-[var(--radius)] border px-3 text-sm transition-colors ${
                    viewMode === 'table'
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                      : 'border-[var(--border)] bg-[var(--input)] text-[var(--foreground-muted)]'
                  }`}
                  onClick={() => onViewModeChange('table')}
                >
                  <LayoutListIcon />
                  Tabla
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-none lg:border lg:shadow-sm">
          <AssetUploader
            folderId={uploadFolderId}
            onUploaded={onUploaded}
          />
        </Card>
      </div>
    </div>
  );
}

function Grid3X3Icon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function LayoutListIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="7" rx="1" />
      <rect x="3" y="14" width="18" height="7" rx="1" />
    </svg>
  );
}
