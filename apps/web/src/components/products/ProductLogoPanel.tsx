import { useMutation } from '@tanstack/react-query';
import { Globe, ImageIcon, Trash2, Upload } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import { getAssetFileUrl } from '@/services/assets';
import { ApiError } from '@/services/api';
import {
  removeProductLogo,
  syncProductLogoFromWebsite,
  uploadProductLogo,
} from '@/services/products';

interface ProductLogoPanelProps {
  productId: string;
  productName: string;
  websiteUrl?: string | null;
  logoAssetId?: string | null;
  logoSourceUrl?: string | null;
  disabled?: boolean;
  onUpdated?: () => void;
}

export function ProductLogoPanel({
  productId,
  productName,
  websiteUrl,
  logoAssetId,
  logoSourceUrl,
  disabled,
  onUpdated,
}: ProductLogoPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = logoAssetId ? getAssetFileUrl(logoAssetId) : null;

  const invalidate = () => {
    onUpdated?.();
  };

  const syncMutation = useMutation({
    mutationFn: () =>
      syncProductLogoFromWebsite(productId, websiteUrl?.trim() ? { url: websiteUrl.trim() } : {}),
    onSuccess: (result) => {
      if (result.synced) {
        toast.success('Logo extraído de la web del producto');
      } else {
        toast.message('No se encontró un logo en la página. Sube uno manualmente.');
      }
      invalidate();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo extraer el logo');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadProductLogo(productId, file),
    onSuccess: () => {
      toast.success('Logo subido correctamente');
      invalidate();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo subir el logo');
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeProductLogo(productId),
    onSuccess: () => {
      toast.message('Logo eliminado');
      invalidate();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar el logo');
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
    event.target.value = '';
  };

  const isBusy =
    disabled || syncMutation.isPending || uploadMutation.isPending || removeMutation.isPending;

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-secondary)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--foreground)]">Logo de {productName}</p>
          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
            Se usa en todas las imágenes generadas por IA (nombre + logo superpuesto).
          </p>
          {logoSourceUrl && (
            <p className="mt-1 truncate text-xs text-[var(--foreground-muted)]" title={logoSourceUrl}>
              Origen: {logoSourceUrl}
            </p>
          )}
          {!websiteUrl?.trim() && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Guarda la URL del producto abajo para poder extraer el logo automáticamente.
            </p>
          )}
        </div>

        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)]">
          {previewUrl ? (
            <img src={previewUrl} alt={`Logo ${productName}`} className="max-h-full max-w-full object-contain p-2" />
          ) : (
            <ImageIcon className="h-8 w-8 text-[var(--foreground-muted)]" />
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isBusy || !websiteUrl?.trim()}
          loading={syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
        >
          <Globe className="h-4 w-4" />
          Extraer de la web
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isBusy}
          loading={uploadMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Subir logo
        </Button>

        {logoAssetId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isBusy}
            loading={removeMutation.isPending}
            onClick={() => removeMutation.mutate()}
          >
            <Trash2 className="h-4 w-4" />
            Quitar
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
