import { AssetBulkSelectionBar } from '@/components/assets/AssetBulkSelectionBar';
import { AssetGridCard } from '@/components/assets/AssetGridCard';
import { Checkbox } from '@/components/atoms/Checkbox';
import { Card } from '@/components/molecules/Card';
import { type Asset, type AssetFolder } from '@/types/assets';

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

export { isAssetLocked, toggleSelection, toggleSectionSelection, sectionSelectionState };

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
  folders: AssetFolder[];
  moveTargetFolder: string;
  onMoveTargetChange: (value: string) => void;
  onMoveSelected: () => void;
  onBulkDelete: () => void;
  movePending?: boolean;
  deletePending?: boolean;
};

export function AssetSection({
  title,
  subtitle,
  assets,
  selectedIds,
  onSelectionChange,
  onPreview,
  onDownload,
  onDuplicate,
  onDelete,
  folders,
  moveTargetFolder,
  onMoveTargetChange,
  onMoveSelected,
  onBulkDelete,
  movePending,
  deletePending,
}: AssetSectionProps) {
  const sectionState = sectionSelectionState(selectedIds, assets);
  const sectionSelected = assets.filter((asset) => selectedIds.has(asset.id));
  const sectionDeletable = sectionSelected.filter((asset) => !isAssetLocked(asset));
  const sectionLocked = sectionSelected.length - sectionDeletable.length;

  return (
    <Card title={title} subtitle={subtitle}>
      <div className="mb-3 space-y-3">
        <Checkbox
          checked={sectionState}
          onChange={(checked) => onSelectionChange(toggleSectionSelection(selectedIds, assets, checked))}
          label="Seleccionar todos"
        />
        {sectionSelected.length > 0 && (
          <AssetBulkSelectionBar
            selectedCount={sectionSelected.length}
            deletableCount={sectionDeletable.length}
            lockedCount={sectionLocked}
            folders={folders}
            moveTargetFolder={moveTargetFolder}
            onMoveTargetChange={onMoveTargetChange}
            onMove={onMoveSelected}
            onDelete={onBulkDelete}
            onClear={() =>
              onSelectionChange(toggleSectionSelection(selectedIds, assets, false))
            }
            movePending={movePending}
            deletePending={deletePending}
          />
        )}
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
