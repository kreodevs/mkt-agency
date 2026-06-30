import { useSearchParams } from 'react-router-dom';
import { useActiveProductStore } from '@/store/active-product';

/** Resuelve productId: URL > store global > undefined */
export function useResolvedProductId(): string | undefined {
  const [searchParams] = useSearchParams();
  const activeProductId = useActiveProductStore((s) => s.productId);
  return searchParams.get('productId') ?? activeProductId ?? undefined;
}

export function useResolvedProductName(): string | null {
  return useActiveProductStore((s) => s.productName);
}
