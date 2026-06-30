import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { listProducts } from '@/services/products';
import { useActiveProductStore } from '@/store/active-product';

export function ActiveProductSelector() {
  const productId = useActiveProductStore((s) => s.productId);
  const productName = useActiveProductStore((s) => s.productName);
  const setActiveProduct = useActiveProductStore((s) => s.setActiveProduct);
  const hydrate = useActiveProductStore((s) => s.hydrate);

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => listProducts(),
  });

  const products = productsQuery.data?.items ?? [];

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (products.length === 0) return;

    if (productId && products.some((p) => p.id === productId)) {
      const match = products.find((p) => p.id === productId);
      if (match && match.name !== productName) {
        setActiveProduct(match.id, match.name);
      }
      return;
    }

    const primary = products.find((p) => p.isPrimary) ?? products[0];
    if (primary) {
      setActiveProduct(primary.id, primary.name);
    }
  }, [productId, productName, products, setActiveProduct]);

  if (products.length <= 1) {
    if (!productName) return null;
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--foreground-muted)]">
        <Package className="h-3.5 w-3.5 shrink-0" />
        <span className="max-w-[140px] truncate font-medium">{productName}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Package className="h-3.5 w-3.5 shrink-0 text-[var(--foreground-muted)]" />
      <select
        className="max-w-[180px] truncate rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs font-medium text-[var(--foreground)]"
        value={productId ?? ''}
        onChange={(event) => {
          const nextId = event.target.value || null;
          const match = products.find((p) => p.id === nextId);
          setActiveProduct(nextId, match?.name ?? null);
        }}
        aria-label="Producto activo"
      >
        <option value="">Todos los productos</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
            {product.isPrimary ? ' ★' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ActiveProductSelector;
