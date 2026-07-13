const STORAGE_KEY = 'mkt-agency-library-view';

export type LibraryViewMode = 'grid' | 'table';

export function readLibraryViewMode(): LibraryViewMode {
  if (typeof window === 'undefined') return 'grid';
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === 'table' ? 'table' : 'grid';
}

export function persistLibraryViewMode(mode: LibraryViewMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, mode);
}
