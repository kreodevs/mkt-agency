import { usePwaUpdate } from '../../hooks/usePwaUpdate';

export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = usePwaUpdate();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-slide-up">
      <div className="bg-[var(--card)] border border-[var(--primary)] shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 max-w-xs">
        <span className="text-sm text-[var(--foreground)] font-medium">
          Nueva versión disponible
        </span>
        <button
          onClick={applyUpdate}
          className="px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:opacity-90 transition-opacity border-none cursor-pointer"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
