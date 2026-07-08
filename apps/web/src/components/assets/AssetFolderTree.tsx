import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { IconButton } from '@/components/atoms/IconButton';
import { buildFolderTree, type FolderNode } from '@/lib/asset-folder-tree';
import type { AssetFolder } from '@/types/assets';

export type FolderSelection = '' | '__unfiled__' | string;

type AssetFolderTreeProps = {
  folders: AssetFolder[];
  selectedId: FolderSelection;
  onSelect: (folderId: FolderSelection) => void;
  onCreate: (name: string, parentId?: string) => void;
  onRename: (folderId: string, name: string) => void;
  onDelete: (folderId: string) => void;
  isBusy?: boolean;
  readOnly?: boolean;
};

type FolderRowProps = {
  node: FolderNode;
  depth: number;
  selectedId: FolderSelection;
  expandedIds: Set<string>;
  onToggleExpand: (folderId: string) => void;
  onSelect: (folderId: FolderSelection) => void;
  onCreateChild: (parentId: string) => void;
  onRename: (folderId: string) => void;
  onDelete: (folderId: string) => void;
  isBusy?: boolean;
  readOnly?: boolean;
};

function FolderRow({
  node,
  depth,
  selectedId,
  expandedIds,
  onToggleExpand,
  onSelect,
  onCreateChild,
  onRename,
  onDelete,
  isBusy,
  readOnly,
}: FolderRowProps) {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;
  const Icon = isSelected ? FolderOpen : Folder;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-[var(--radius)] px-1 py-1 ${
          isSelected ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-[var(--secondary)]'
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--foreground-muted)]"
          onClick={() => (hasChildren ? onToggleExpand(node.id) : onSelect(node.id))}
          aria-label={hasChildren ? (isExpanded ? 'Contraer' : 'Expandir') : 'Seleccionar carpeta'}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <span className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
          onClick={() => onSelect(node.id)}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>

        <div className={`flex shrink-0 items-center ${readOnly ? 'hidden' : 'opacity-0 transition group-hover:opacity-100'}`}>
          <IconButton
            type="button"
            label="Subcarpeta"
            disabled={isBusy}
            onClick={() => onCreateChild(node.id)}
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            type="button"
            label="Renombrar"
            disabled={isBusy}
            onClick={() => onRename(node.id)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            type="button"
            tone="destructive"
            label="Eliminar"
            disabled={isBusy}
            onClick={() => onDelete(node.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      {isExpanded &&
        node.children.map((child) => (
          <FolderRow
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
            onSelect={onSelect}
            onCreateChild={onCreateChild}
            onRename={onRename}
            onDelete={onDelete}
            isBusy={isBusy}
            readOnly={readOnly}
          />
        ))}
    </div>
  );
}

export function AssetFolderTree({
  folders,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  isBusy,
  readOnly,
}: AssetFolderTreeProps) {
  const tree = useMemo(() => buildFolderTree(folders), [folders]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [creatingParentId, setCreatingParentId] = useState<string | null | undefined>(undefined);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const toggleExpand = (folderId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const startCreate = (parentId?: string) => {
    setCreatingParentId(parentId ?? null);
    setNewFolderName('');
    if (parentId) {
      setExpandedIds((current) => new Set(current).add(parentId));
    }
  };

  const submitCreate = () => {
    const name = newFolderName.trim();
    if (!name) {
      return;
    }
    onCreate(name, creatingParentId ?? undefined);
    setCreatingParentId(undefined);
    setNewFolderName('');
  };

  const startRename = (folderId: string) => {
    const folder = folders.find((item) => item.id === folderId);
    if (!folder) {
      return;
    }
    setRenamingId(folderId);
    setRenameValue(folder.name);
  };

  const submitRename = () => {
    if (!renamingId) {
      return;
    }
    const name = renameValue.trim();
    if (!name) {
      return;
    }
    onRename(renamingId, name);
    setRenamingId(null);
    setRenameValue('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
          Carpetas
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 gap-1 px-2 ${readOnly ? 'hidden' : ''}`}
          disabled={isBusy}
          onClick={() => startCreate()}
        >
          <FolderPlus className="h-4 w-4" />
          Nueva
        </Button>
      </div>

      <div className="space-y-0.5">
        <button
          type="button"
          className={`flex w-full items-center gap-2 rounded-[var(--radius)] px-2 py-1.5 text-left text-sm ${
            selectedId === ''
              ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
              : 'hover:bg-[var(--secondary)]'
          }`}
          onClick={() => onSelect('')}
        >
          <FolderOpen className="h-4 w-4 shrink-0" />
          Todas
        </button>

        <button
          type="button"
          className={`flex w-full items-center gap-2 rounded-[var(--radius)] px-2 py-1.5 text-left text-sm ${
            selectedId === '__unfiled__'
              ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
              : 'hover:bg-[var(--secondary)]'
          }`}
          onClick={() => onSelect('__unfiled__')}
        >
          <Folder className="h-4 w-4 shrink-0" />
          Sin carpeta
        </button>

        {tree.map((node) => (
          <FolderRow
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onToggleExpand={toggleExpand}
            onSelect={onSelect}
            onCreateChild={startCreate}
            onRename={startRename}
            onDelete={onDelete}
            isBusy={isBusy}
            readOnly={readOnly}
          />
        ))}
      </div>

      {!readOnly && creatingParentId !== undefined && (
        <div className="space-y-2 rounded-[var(--radius)] border border-[var(--border)] p-3">
          <p className="text-xs text-[var(--foreground-muted)]">
            {creatingParentId ? 'Nueva subcarpeta' : 'Nueva carpeta'}
          </p>
          <InputText
            value={newFolderName}
            placeholder="Ej. iOS, iPad, PC"
            onChange={(event) => setNewFolderName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                submitCreate();
              }
              if (event.key === 'Escape') {
                setCreatingParentId(undefined);
              }
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={isBusy || !newFolderName.trim()} onClick={submitCreate}>
              Crear
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setCreatingParentId(undefined)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {!readOnly && renamingId && (
        <div className="space-y-2 rounded-[var(--radius)] border border-[var(--border)] p-3">
          <p className="text-xs text-[var(--foreground-muted)]">Renombrar carpeta</p>
          <InputText
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                submitRename();
              }
              if (event.key === 'Escape') {
                setRenamingId(null);
              }
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={isBusy || !renameValue.trim()} onClick={submitRename}>
              Guardar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--foreground-subtle)]">
        Tip: nombra carpetas PC, iPad o iOS para que el copiloto CM elija capturas por dispositivo.
      </p>
    </div>
  );
}
