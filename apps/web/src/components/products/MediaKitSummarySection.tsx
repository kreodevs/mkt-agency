import { useMemo } from 'react';
import { PRODUCT_MEDIA_ROLE_LABELS, type ProductMediaKitItem, type ProductMediaRole } from '@/types/product';

const MEDIA_KIT_RECOMMENDED_MIN_IMAGES = 3;

interface SummarySegment {
  role: ProductMediaRole;
  shortLabel: string;
}

const SUMMARY_SEGMENTS: SummarySegment[] = [
  { role: 'product-screenshot', shortLabel: 'capturas' },
  { role: 'event-photo', shortLabel: 'eventos' },
  { role: 'team-photo', shortLabel: 'equipo' },
  { role: 'product-demo', shortLabel: 'videos' },
  { role: 'testimonial', shortLabel: 'testimonios' },
  { role: 'b-roll', shortLabel: 'b-roll' },
  { role: 'other', shortLabel: 'otros' },
];

interface MediaKitSummarySectionProps {
  items: ProductMediaKitItem[];
  filterRole: string;
  onFilterRole: (role: ProductMediaRole) => void;
  onResetFilter: () => void;
}

export function MediaKitSummarySection({
  items,
  filterRole,
  onFilterRole,
  onResetFilter,
}: MediaKitSummarySectionProps) {
  const roleCounts = useMemo(() => {
    const counts = new Map<ProductMediaRole, number>();
    for (const item of items) {
      counts.set(item.role, (counts.get(item.role) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const imageCount = useMemo(
    () => items.filter((item) => item.assetType === 'image' || item.mimeType?.startsWith('image/')).length,
    [items],
  );

  return (
    <div
      className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-secondary)] p-[var(--spacing-md)]"
      aria-label="Resumen del media kit"
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-[var(--foreground)]">Resumen del kit</p>
        <p className="text-xs text-[var(--foreground-muted)]">
          {items.length} asset{items.length === 1 ? '' : 's'} · {imageCount} imagen
          {imageCount === 1 ? '' : 'es'}
        </p>
      </div>

      <p className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-[var(--foreground)]">
        {SUMMARY_SEGMENTS.map((segment, index) => {
          const count = roleCounts.get(segment.role) ?? 0;
          return (
            <span key={segment.role} className="inline-flex items-center">
              {index > 0 && (
                <span className="mx-1 text-[var(--foreground-muted)]" aria-hidden="true">·</span>
              )}
              <button
                type="button"
                className={[
                  'rounded-[var(--radius-sm)] px-1.5 py-0.5 transition-colors',
                  'hover:bg-[var(--background)] hover:text-[var(--primary)]',
                  filterRole === segment.role
                    ? 'bg-[var(--background)] font-medium text-[var(--primary)]'
                    : '',
                ].join(' ')}
                title={`Filtrar: ${PRODUCT_MEDIA_ROLE_LABELS[segment.role]}`}
                onClick={() => onFilterRole(segment.role)}
              >
                <span className="tabular-nums">{count}</span>{' '}
                <span className="text-[var(--foreground-muted)]">{segment.shortLabel}</span>
              </button>
            </span>
          );
        })}
      </p>

      {imageCount < MEDIA_KIT_RECOMMENDED_MIN_IMAGES && (
        <p className="mt-2 text-xs text-[var(--warning)]">
          Sube al menos {MEDIA_KIT_RECOMMENDED_MIN_IMAGES} imágenes ({imageCount}/{MEDIA_KIT_RECOMMENDED_MIN_IMAGES}) para diseños menos genéricos en el copiloto.
        </p>
      )}

      {filterRole !== 'all' && (
        <button
          type="button"
          className="mt-2 text-xs text-[var(--primary)] hover:underline"
          onClick={onResetFilter}
        >
          Ver todos los assets
        </button>
      )}
    </div>
  );
}
