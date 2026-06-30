import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { getProduct } from '@/services/products';

interface ProductContextBannerProps {
  productId: string | null | undefined;
  productName?: string | null;
}

export function ProductContextBanner({ productId, productName }: ProductContextBannerProps) {
  const needsFetch = Boolean(productId) && !productName;

  const productQuery = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProduct(productId!),
    enabled: needsFetch,
  });

  if (!productId) return null;

  const name = productName ?? productQuery.data?.name ?? 'Producto';

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-[var(--radius)] border border-[var(--primary)]/25 bg-[var(--primary)]/5 px-[var(--spacing-lg)] py-[var(--spacing-md)]">
      <Package className="h-5 w-5 shrink-0 text-[var(--primary)]" />
      <div className="min-w-0 flex-1 text-sm">
        <span className="font-semibold text-[var(--primary)]">Contexto: producto</span>
        <span className="text-[var(--foreground-muted)]">
          {' '}
          — Los agentes trabajan sobre <strong className="text-[var(--foreground)]">{name}</strong>.
        </span>
      </div>
      <Link
        to={`/products/${productId}/onboarding`}
        className="text-xs font-medium text-[var(--primary)] underline hover:no-underline"
      >
        Ver onboarding
      </Link>
    </div>
  );
}
