import { cn } from '@/lib/utils';

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius-md)] bg-[var(--secondary)]',
        className,
      )}
      aria-hidden
    />
  );
}

export function InboxPageSkeleton() {
  return (
    <div className="space-y-[var(--spacing-lg)]" aria-busy="true" aria-label="Cargando bandeja">
      <SkeletonBlock className="h-24 w-full" />
      <div className="grid gap-[var(--spacing-md)] sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-24" />
        ))}
      </div>
      <SkeletonBlock className="h-64 w-full" />
      <SkeletonBlock className="h-48 w-full" />
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="space-y-[var(--spacing-lg)]" aria-busy="true" aria-label="Cargando producto">
      <SkeletonBlock className="h-10 w-64" />
      <SkeletonBlock className="h-32 w-full" />
      <SkeletonBlock className="h-96 w-full max-w-xl" />
    </div>
  );
}

export function ListPageSkeleton() {
  return (
    <div className="page-stack" aria-busy="true" aria-label="Cargando listado">
      <SkeletonBlock className="h-10 w-72" />
      <SkeletonBlock className="h-12 w-full max-w-2xl" />
      <SkeletonBlock className="h-64 w-full" />
    </div>
  );
}

export function AssetGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      aria-busy="true"
      aria-label="Cargando activos"
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock key={index} className="aspect-square w-full" />
      ))}
    </div>
  );
}
