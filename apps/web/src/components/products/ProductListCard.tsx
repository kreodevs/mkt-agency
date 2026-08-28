import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ClipboardList,
  Images,
  Package,
  Star,
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { listCardClassName } from '@/lib/list-card';
import type { Product } from '@/types/product';

export interface ProductListCardProps {
  product: Product;
  /** Oculta acciones avanzadas (n8n, campañas) en vista SOHO */
  sohoMode?: boolean;
}

export function ProductListCard({ product, sohoMode = false }: ProductListCardProps) {
  const pct = product.onboardingCompletionPercentage ?? 0;
  const done = product.onboardingCompleted;

  return (
    <article className={listCardClassName()}>
      <div className="flex items-start justify-between gap-[var(--spacing-sm)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[var(--spacing-xs)]">
            <Package className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
            <h3 className="truncate font-semibold text-[var(--foreground)]">{product.name}</h3>
            {product.isPrimary ? (
              <Star
                className="h-3.5 w-3.5 shrink-0 fill-[var(--warning)] text-[var(--warning)]"
                aria-label="Producto principal"
              />
            ) : null}
          </div>
          {product.targetAudience ? (
            <p className="mt-[var(--spacing-xs)] line-clamp-2 text-sm text-[var(--foreground-muted)]">
              {product.targetAudience}
            </p>
          ) : null}
          <div className="mt-[var(--spacing-sm)] flex flex-wrap items-center gap-[var(--spacing-sm)]">
            <StatusPill
              status={product.status === 'active' ? 'success' : 'neutral'}
              size="sm"
            >
              {product.status === 'active' ? 'Activo' : 'Archivado'}
            </StatusPill>
            {!done && (
              <span className="text-xs tabular-nums text-[var(--foreground-muted)]">
                Onboarding {pct}%
              </span>
            )}
          </div>
        </div>
        <Link
          to={`/products/${product.id}`}
          className="shrink-0 rounded-[var(--radius-sm)] p-1 text-[var(--foreground-muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          aria-label={`Ver ${product.name}`}
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="mt-[var(--spacing-md)] flex flex-wrap gap-[var(--spacing-sm)]">
        {!done && (
          <Link to={`/products/${product.id}/onboarding`}>
            <Button variant="outline" size="sm" className="gap-1">
              <ClipboardList className="h-3.5 w-3.5" />
              Completar perfil
            </Button>
          </Link>
        )}
        <Link to={`/products/${product.id}/media-kit`}>
          <Button variant="outline" size="sm" className="gap-1">
            <Images className="h-3.5 w-3.5" />
            Kit de medios
          </Button>
        </Link>
        <Link to={`/products/${product.id}`}>
          <Button size="sm">Editar</Button>
        </Link>
        {!sohoMode && (
          <Link to={`/campaigns/new?productId=${product.id}`}>
            <Button variant="outline" size="sm">
              Nueva campaña
            </Button>
          </Link>
        )}
      </div>
    </article>
  );
}

export default ProductListCard;
