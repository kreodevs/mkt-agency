import { useMutation, useQuery } from '@tanstack/react-query';
import { Film, ImageIcon, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { toast } from '@/components/molecules/Sonner';
import { getAssetFileUrl } from '@/services/assets';
import { ApiError } from '@/services/api';
import {
  listProductMediaKit,
  removeProductMediaKitItem,
  uploadProductMediaKit,
} from '@/services/products';
import {
  PRODUCT_MEDIA_ROLE_LABELS,
  PRODUCT_MEDIA_ROLES,
  type ProductMediaRole,
} from '@/types/product';

const selectClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

interface ProductMediaKitPanelProps {
  productId: string;
  productName: string;
  disabled?: boolean;
}

function isVideoMime(mimeType: string | null): boolean {
  return Boolean(mimeType?.startsWith('video/'));
}

export function ProductMediaKitPanel({
  productId,
  productName,
  disabled,
}: ProductMediaKitPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState<ProductMediaRole>('product-screenshot');
  const [label, setLabel] = useState('');

  const kitQuery = useQuery({
    queryKey: ['product-media-kit', productId],
    queryFn: () => listProductMediaKit(productId),
    enabled: Boolean(productId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadProductMediaKit(productId, file, role, label),
    onSuccess: () => {
      toast.success('Archivo añadido al kit de medios');
      setLabel('');
      void kitQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo subir el archivo');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeProductMediaKitItem(productId, itemId),
    onSuccess: () => {
      toast.message('Archivo eliminado del kit');
      void kitQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar');
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
    event.target.value = '';
  };

  const isBusy = disabled || uploadMutation.isPending || removeMutation.isPending;
  const items = kitQuery.data?.items ?? [];

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-secondary)] p-4">
      <div className="mb-4">
        <p className="text-sm font-medium text-[var(--foreground)]">Kit de medios — {productName}</p>
        <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
          Fotos y videos reales del producto. El Community Manager los prioriza al componer posts y reels
          antes de generar stock con IA.
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--foreground)]">Tipo de asset</span>
          <select
            className={selectClass}
            value={role}
            disabled={isBusy}
            onChange={(e) => setRole(e.target.value as ProductMediaRole)}
          >
            {PRODUCT_MEDIA_ROLES.map((value) => (
              <option key={value} value={value}>
                {PRODUCT_MEDIA_ROLE_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        <InputText
          label="Etiqueta (opcional)"
          value={label}
          disabled={isBusy}
          placeholder="Ej. Demo onboarding v2"
          onChange={(e) => setLabel(e.target.value)}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 sm:mb-0"
          disabled={isBusy}
          loading={uploadMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Subir archivo
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {kitQuery.isLoading ? (
        <p className="text-xs text-[var(--foreground-muted)]">Cargando kit...</p>
      ) : items.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-[var(--border)] px-4 py-6 text-center text-xs text-[var(--foreground-muted)]">
          Aún no hay assets. Sube capturas de la app, fotos de eventos o un video demo.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const previewUrl = getAssetFileUrl(item.assetId);
            const isVideo = isVideoMime(item.mimeType);

            return (
              <li
                key={item.id}
                className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)]"
              >
                <div className="relative flex aspect-video items-center justify-center bg-[var(--background-secondary)]">
                  {isVideo && previewUrl ? (
                    <video
                      src={previewUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={item.label ?? item.assetName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-[var(--foreground-muted)]" />
                  )}
                  <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    {isVideo ? (
                      <span className="inline-flex items-center gap-1">
                        <Film className="h-3 w-3" />
                        Video
                      </span>
                    ) : (
                      'Imagen'
                    )}
                  </span>
                </div>

                <div className="space-y-1 p-3">
                  <p className="text-xs font-medium text-[var(--foreground)]">
                    {PRODUCT_MEDIA_ROLE_LABELS[item.role] ?? item.role}
                  </p>
                  {item.label && (
                    <p className="truncate text-xs text-[var(--foreground-muted)]" title={item.label}>
                      {item.label}
                    </p>
                  )}
                  <p className="truncate text-[10px] text-[var(--foreground-muted)]" title={item.assetName}>
                    {item.assetName}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full gap-2"
                    disabled={isBusy}
                    loading={removeMutation.isPending && removeMutation.variables === item.id}
                    onClick={() => removeMutation.mutate(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Quitar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
