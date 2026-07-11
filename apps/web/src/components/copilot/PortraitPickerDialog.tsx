import { useQuery } from '@tanstack/react-query';
import { ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Dialog } from '@/components/molecules/Dialog';
import { LIBRARY_ROUTE } from '@/lib/tenant-navigation';
import { listAssets, resolveAssetPreviewUrl } from '@/services/assets';

type PortraitPickerDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (assetId: string) => void;
  isPending: boolean;
};

export function PortraitPickerDialog({
  open,
  onClose,
  onSelect,
  isPending,
}: PortraitPickerDialogProps) {
  const imageAssetsQuery = useQuery({
    queryKey: ['assets', 'image', 'cm-portrait-picker'],
    queryFn: () => listAssets({ type: 'image', limit: 48, page: 1 }),
    enabled: open,
  });

  return (
    <Dialog
      visible={open}
      onHide={onClose}
      title="Elegir retrato desde biblioteca"
      description="Selecciona una imagen vertical 9:16 de tus assets."
      size="xl"
      footer={
        <Link
          to={LIBRARY_ROUTE}
          className="text-sm font-medium text-[var(--primary)] hover:underline"
          onClick={onClose}
        >
          Abrir librería completa →
        </Link>
      }
    >
      {imageAssetsQuery.isLoading ? (
        <p className="text-sm text-[var(--foreground-muted)]">Cargando imágenes...</p>
      ) : imageAssetsQuery.data?.items.length ? (
        <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
          {imageAssetsQuery.data.items.map((asset) => {
            const preview = resolveAssetPreviewUrl(asset, { variant: 'thumb' });
            return (
              <button
                key={asset.id}
                type="button"
                disabled={isPending}
                onClick={() => onSelect(asset.id)}
                className="group overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] text-left transition hover:border-[var(--primary)]"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt={asset.name}
                    className="aspect-[9/16] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[9/16] items-center justify-center bg-[var(--secondary)]">
                    <ImageIcon className="h-8 w-8 text-[var(--foreground-muted)]" />
                  </div>
                )}
                <p className="truncate px-2 py-1 text-xs text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]">
                  {asset.name}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--foreground-muted)]">
            No hay imágenes en la biblioteca. Sube material en la librería o genera un retrato con
            IA.
          </p>
          <Link to={LIBRARY_ROUTE} onClick={onClose}>
            <Button type="button" variant="secondary" size="sm">
              <ImageIcon className="mr-2 h-4 w-4" />
              Ir a librería multimedia
            </Button>
          </Link>
        </div>
      )}
    </Dialog>
  );
}
