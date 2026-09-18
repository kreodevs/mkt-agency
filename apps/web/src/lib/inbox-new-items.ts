const STORAGE_KEY = 'mkt-agency-inbox-new-content-ids';
const SNAPSHOT_KEY = 'mkt-agency-inbox-pending-snapshot';

type NewInboxStore = Record<string, string[]>;

type PendingSnapshot = {
  productId: string | null;
  ids: string[];
};

function storageKey(productId: string | null | undefined): string {
  return productId ?? '__all__';
}

function readStore(): NewInboxStore {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as NewInboxStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

const EMPTY_NEW_CONTENT_IDS = new Set<string>();
const snapshotCache = new Map<string, { ids: string[]; set: Set<string> }>();

function idsAreEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function invalidateSnapshotCache(): void {
  snapshotCache.clear();
}

function writeStore(store: NewInboxStore): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  invalidateSnapshotCache();
  window.dispatchEvent(new CustomEvent('inbox-new-items-changed'));
}

export function subscribeInboxNewItems(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener('inbox-new-items-changed', handler);
  return () => window.removeEventListener('inbox-new-items-changed', handler);
}

export function getNewInboxContentIds(productId: string | null | undefined): Set<string> {
  const key = storageKey(productId);
  const ids = readStore()[key] ?? [];

  if (ids.length === 0) {
    return EMPTY_NEW_CONTENT_IDS;
  }

  const cached = snapshotCache.get(key);
  if (cached && idsAreEqual(cached.ids, ids)) {
    return cached.set;
  }

  const set = new Set(ids);
  snapshotCache.set(key, { ids: [...ids], set });
  return set;
}

export function markNewInboxContentIds(
  productId: string | null | undefined,
  contentIds: string[],
): void {
  if (contentIds.length === 0) return;

  const key = storageKey(productId);
  const store = readStore();
  const merged = new Set([...(store[key] ?? []), ...contentIds]);
  store[key] = [...merged];
  writeStore(store);
}

export function clearNewInboxContentId(
  productId: string | null | undefined,
  contentId: string,
): void {
  const key = storageKey(productId);
  const store = readStore();
  const next = (store[key] ?? []).filter((id) => id !== contentId);
  if (next.length === 0) {
    delete store[key];
  } else {
    store[key] = next;
  }
  writeStore(store);
}

export function diffNewInboxContentIds(
  beforeIds: Set<string>,
  afterIds: string[],
): string[] {
  return afterIds.filter((id) => !beforeIds.has(id));
}

export function saveInboxPendingSnapshot(
  productId: string | null | undefined,
  contentIds: string[],
): void {
  const snapshot: PendingSnapshot = {
    productId: productId ?? null,
    ids: contentIds,
  };
  sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export function consumeInboxPendingSnapshot(
  productId: string | null | undefined,
): Set<string> | null {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;

    const snapshot = JSON.parse(raw) as PendingSnapshot;
    sessionStorage.removeItem(SNAPSHOT_KEY);

    const snapshotProduct = snapshot.productId ?? null;
    const activeProduct = productId ?? null;
    if (snapshotProduct !== activeProduct) {
      return new Set(snapshot.ids);
    }

    return new Set(snapshot.ids);
  } catch {
    sessionStorage.removeItem(SNAPSHOT_KEY);
    return null;
  }
}
