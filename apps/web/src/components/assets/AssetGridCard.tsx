import { Copy, Download, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/atoms/Checkbox';
import { IconButton, ACTION_BUTTON_GROUP_CLASS } from '@/components/atoms/IconButton';
import { AssetThumbnail } from '@/components/assets/AssetThumbnail';
import type { Asset } from '@/types/assets';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type AssetGridCardProps = {
  asset: Asset;
  selected: boolean;
  locked: boolean;
  onSelectToggle: (checked: boolean) => void;
  onOpenPreview: () => void;
  onDownload: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function AssetGridCard({
  asset,
  selected,
  locked,
  onSelectToggle,
  onOpenPreview,
  onDownload,
  onDuplicate,
  onDelete,
}: AssetGridCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-[var(--card)] transition-all hover:shadow-md ${
        selected ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/30' : 'border-[var(--border)]'
      }`}
    >
      <div
        className="absolute left-2 top-2 z-10 rounded-[var(--radius-sm)] bg-[var(--card)]/90 p-0.5 shadow-sm"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <Checkbox checked={selected} onChange={onSelectToggle} aria-label={`Seleccionar ${asset.name}`} />
      </div>

      <button
        type="button"
        className="block w-full cursor-zoom-in text-left"
        onClick={onOpenPreview}
        aria-label={`Ver ${asset.name}`}
      >
        <AssetThumbnail asset={asset} />
      </button>

      <div
        className={`absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 ${ACTION_BUTTON_GROUP_CLASS}`}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
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
          {locked && ' · En uso'}
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
