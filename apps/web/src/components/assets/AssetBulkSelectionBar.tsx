import { FolderInput, Trash2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { resolveFolderPath } from '@/lib/asset-folder-tree';
import type { AssetFolder } from '@/types/assets';

const selectClass =
  'h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

type AssetBulkSelectionBarProps = {
  selectedCount: number;
  deletableCount: number;
  lockedCount: number;
  folders: AssetFolder[];
  moveTargetFolder: string;
  onMoveTargetChange: (value: string) => void;
  onMove: () => void;
  onDelete: () => void;
  onClear: () => void;
  movePending?: boolean;
  deletePending?: boolean;
  /** Barra pegada al borde inferior de la ventana */
  fixed?: boolean;
};

export function AssetBulkSelectionBar({
  selectedCount,
  deletableCount,
  lockedCount,
  folders,
  moveTargetFolder,
  onMoveTargetChange,
  onMove,
  onDelete,
  onClear,
  movePending,
  deletePending,
  fixed = false,
}: AssetBulkSelectionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  const content = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-medium text-[var(--foreground)]">
        {selectedCount} seleccionado(s)
        {lockedCount > 0 && ` · ${lockedCount} en uso (no se eliminarán)`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={selectClass}
          value={moveTargetFolder}
          onChange={(event) => onMoveTargetChange(event.target.value)}
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
          size="sm"
          className="gap-2"
          disabled={!moveTargetFolder || movePending}
          onClick={onMove}
        >
          <FolderInput className="h-4 w-4" />
          Mover
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Deseleccionar
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="gap-2"
          disabled={deletableCount === 0 || deletePending}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Eliminar ({deletableCount})
        </Button>
      </div>
    </div>
  );

  if (fixed) {
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--background)]/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm"
        role="toolbar"
        aria-label="Acciones de selección múltiple"
      >
        <div className="mx-auto w-full max-w-[1600px]">{content}</div>
      </div>
    );
  }

  return (
    <Card className="border-[var(--primary)]/40 bg-[var(--primary)]/5">{content}</Card>
  );
}
