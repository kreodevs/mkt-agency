import type { AssetFolder } from '@/types/assets';

export type FolderNode = AssetFolder & {
  children: FolderNode[];
};

export function buildFolderTree(folders: AssetFolder[]): FolderNode[] {
  const nodes = new Map<string, FolderNode>();
  const roots: FolderNode[] = [];

  for (const folder of folders) {
    nodes.set(folder.id, { ...folder, children: [] });
  }

  for (const folder of folders) {
    const node = nodes.get(folder.id);
    if (!node) {
      continue;
    }
    if (folder.parentId && nodes.has(folder.parentId)) {
      nodes.get(folder.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (items: FolderNode[]) => {
    items.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    for (const item of items) {
      sortNodes(item.children);
    }
  };

  sortNodes(roots);
  return roots;
}

export function resolveFolderPath(
  folders: AssetFolder[],
  folderId: string | null | undefined,
): string | null {
  if (!folderId) {
    return null;
  }

  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const segments: string[] = [];
  let current = byId.get(folderId);

  while (current) {
    segments.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return segments.length ? segments.join(' / ') : null;
}
