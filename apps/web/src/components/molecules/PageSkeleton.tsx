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
