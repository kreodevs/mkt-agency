import { create } from 'zustand';

const STORAGE_KEY = 'mkt-agency-active-product';

interface ActiveProductState {
  productId: string | null;
  productName: string | null;
  setActiveProduct: (productId: string | null, productName?: string | null) => void;
  hydrate: () => void;
}

function loadPersisted(): Pick<ActiveProductState, 'productId' | 'productName'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { productId: null, productName: null };
    const parsed = JSON.parse(raw) as { productId?: string; productName?: string };
    return {
      productId: parsed.productId ?? null,
      productName: parsed.productName ?? null,
    };
  } catch {
    return { productId: null, productName: null };
  }
}

function persist(productId: string | null, productName: string | null): void {
  try {
    if (!productId) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ productId, productName }));
  } catch {
    /* ignore */
  }
}

export const useActiveProductStore = create<ActiveProductState>((set) => ({
  ...loadPersisted(),
  setActiveProduct: (productId, productName = null) => {
    persist(productId, productName);
    set({ productId, productName: productName ?? null });
  },
  hydrate: () => {
    set(loadPersisted());
  },
}));

export function withActiveProductQuery(path: string): string {
  const { productId } = useActiveProductStore.getState();
  if (!productId) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}productId=${encodeURIComponent(productId)}`;
}
