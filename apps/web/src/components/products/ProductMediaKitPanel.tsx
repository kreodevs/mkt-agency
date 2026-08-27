import { useMutation, useQuery } from '@tanstack/react-query';
import { Eye, Film, FolderOpen, ImageIcon, Trash2, Upload } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Select } from '@/components/atoms/Select';
import { EmptyState } from '@/components/molecules/EmptyState';
import { StatusPill } from '@/components/atoms/StatusPill';
import { toast } from '@/components/molecules/Sonner';
import { AssetLibraryPickerDialog } from '@/components/assets/AssetLibraryPickerDialog';
import { AssetPreviewDialog } from '@/components/assets/AssetPreviewDialog';
import { getAssetDownloadUrl, getAssetFileUrl } from '@/services/assets';
import { ApiError } from '@/services/api';
import {
  linkProductMediaKit,
  listProductMediaKit,
  removeProductMediaKitItem,
  uploadProductMediaKit,
} from '@/services/products';
import type { Asset, AssetType } from '@/types/assets';
import {
  PRODUCT_MEDIA_ROLE_LABELS,
  PRODUCT_MEDIA_ROLES,
  type ProductMediaKitItem,
  type ProductMediaRole,
} from '@/types/product';

const ACCEPTED_MIME_PREFIXES = ['image/', 'video/'];

interface ProductMediaKitPanelProps {
  productId: string;
  productName: string;
  disabled?: boolean;
}

function isVideoMime(mimeType: string | null): boolean {
  return Boolean(mimeType?.startsWith('video/'));
}

function isAcceptedFile(file: File): boolean {
  return ACCEPTED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix));
}

function toPreviewAsset(item: ProductMediaKitItem): Asset {
  const assetType: AssetType =
    item.assetType === 'video' ||
    item.assetType === 'audio' ||
    item.assetType === 'document' ||
    item.assetType === 'other'
      ? item.assetType
      : 'image';

  return {
    id: item.assetId,
    tenantId: '',
    folderId: null,
    name: item.label ?? item.assetName,
    type: assetType,
    mimeType: item.mimeType,
    fileKey: '',
    fileSize: 0,
    url: item.url,
    thumbnailUrl: null,
    metadata: {},
    referenceCount: 0,
    isInUse: false,
    tags: [],
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
  };
}

export function ProductMediaKitPanel({
  productId,
  productName,
  disabled,
}: ProductMediaKitPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const [role, setRole] = useState<ProductMediaRole>('product-screenshot');
  const [label, setLabel] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<ProductMediaKitItem | null>(null);

  const kitQuery = useQuery({
    queryKey: ['product-media-kit', productId],
    queryFn: () => listProductMediaKit(productId),
    enabled: Boolean(productId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadProductMediaKit(productId, file, role, label),
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

  const linkMutation = useMutation({
    mutationFn: (assetId: string) =>
      linkProductMediaKit(productId, { assetId, role, label: label || undefined }),
    onSuccess: () => {
      toast.success('Archivo enlazado desde la librería');
      setLibraryPickerOpen(false);
      void kitQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo enlazar');
    },
  });

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const accepted = files.filter(isAcceptedFile);
      if (!accepted.length) {
        toast.error('Solo se aceptan imágenes o videos');
        return;
      }

      let uploaded = 0;
      for (const file of accepted) {
        try {
          await uploadMutation.mutateAsync(file);
          uploaded += 1;
        } catch {
          break;
        }
      }

      if (uploaded > 0) {
        toast.success(
          uploaded === 1 ? 'Archivo añadido al kit' : `${uploaded} archivos añadidos al kit`,
        );
        setLabel('');
        void kitQuery.refetch();
      }
    },
    [kitQuery, uploadMutation],
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList?.length) return;
    void uploadFiles(Array.from(fileList));
    event.target.value = '';
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    if (disabled || uploadMutation.isPending) return;
    void uploadFiles(Array.from(event.dataTransfer.files));
  };

  const isBusy =
    disabled || uploadMutation.isPending || removeMutation.isPending || linkMutation.isPending;
  const items = kitQuery.data?.items ?? [];

  const handleDownloadPreview = async (asset: Asset) => {
    try {
      const { url } = await getAssetDownloadUrl(asset.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo descargar el archivo');
    }
  };

  return (
    <div className="space-y-[var(--spacing-lg)]">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <Select
          label="Tipo de asset"
          value={role}
          disabled={isBusy}
          onChange={(e) => setRole(e.target.value as ProductMediaRole)}
          options={PRODUCT_MEDIA_ROLES.map((value) => ({
            value,
            label: PRODUCT_MEDIA_ROLE_LABELS[value],
          }))}
        />

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
          onClick={() => setLibraryPickerOpen(true)}
        >
          <FolderOpen className="h-4 w-4" />
          Desde librería
        </Button>

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
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Zona para arrastrar archivos al kit de medios"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={[
          'rounded-[var(--radius)] border-2 border-dashed px-6 py-10 text-center transition-colors',
          isDragOver
            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
            : 'border-[var(--border)] bg-[var(--background-secondary)]',
          isBusy ? 'pointer-events-none opacity-60' : 'cursor-pointer',
        ].join(' ')}
        onClick={() => {
          if (!isBusy) fileInputRef.current?.click();
        }}
      >
        <Upload
          className={[
            'mx-auto mb-3 h-8 w-8',
            isDragOver ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]',
          ].join(' ')}
        />
        <p className="text-sm font-medium text-[var(--foreground)]">
          {isDragOver ? 'Suelta los archivos aquí' : 'Arrastra imágenes o videos aquí'}
        </p>
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          O haz clic para elegir archivos — {productName}
        </p>
        {uploadMutation.isPending && (
          <p className="mt-2 text-xs text-[var(--primary)]">Subiendo...</p>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-[var(--foreground)]">
            Assets subidos
            {!kitQuery.isLoading && (
              <span className="ml-2 text-[var(--foreground-muted)]">({items.length})</span>
            )}
          </p>
        </div>

        {kitQuery.isLoading ? (
          <p className="text-xs text-[var(--foreground-muted)]">Cargando kit...</p>
        ) : items.length === 0 ? (
          <EmptyState
            compact
            icon={ImageIcon}
            title="Sin assets todavía"
            description="Sube capturas de la app, fotos de eventos o un video demo para que el Community Manager los use al componer posts."
            action={{
              label: 'Subir archivo',
              onClick: () => fileInputRef.current?.click(),
            }}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const previewUrl = getAssetFileUrl(item.assetId, 'thumb');
              const isVideo = isVideoMime(item.mimeType);

              return (
                <li
                  key={item.id}
                  className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)]"
                >
                  <button
                    type="button"
                    className="group relative flex aspect-video w-full cursor-zoom-in items-center justify-center bg-[var(--background-secondary)]"
                    aria-label={`Ver ${item.label ?? item.assetName}`}
                    onClick={() => setPreviewItem(item)}
                  >
                    {isVideo && previewUrl ? (
                      <video
                        src={previewUrl}
                        className="h-full w-full object-contain"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={item.label ?? item.assetName}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-[var(--foreground-muted)]" />
                    )}
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--foreground)]/0 transition-colors group-hover:bg-[var(--foreground)]/10">
                      <Eye className="h-6 w-6 text-[var(--background)] opacity-0 drop-shadow transition-opacity group-hover:opacity-100" />
                    </span>
                    <StatusPill
                      status="neutral"
                      size="sm"
                      className="absolute left-[var(--spacing-sm)] top-[var(--spacing-sm)] bg-[var(--foreground)]/80 text-[var(--background)]"
                    >
                      {isVideo ? (
                        <span className="inline-flex items-center gap-1">
                          <Film className="h-3 w-3" />
                          Video
                        </span>
                      ) : (
                        'Imagen'
                      )}
                    </StatusPill>
                  </button>

                  <div className="space-y-1 p-3">
                    <p className="text-xs font-medium text-[var(--foreground)]">
                      {PRODUCT_MEDIA_ROLE_LABELS[item.role] ?? item.role}
                    </p>
                    {item.label && (
                      <p className="truncate text-xs text-[var(--foreground-muted)]" title={item.label}>
                        {item.label}
                      </p>
                    )}
                    <p className="truncate text-xs text-[var(--foreground-muted)]" title={item.assetName}>
                      {item.assetName}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={isBusy}
                        onClick={() => setPreviewItem(item)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={isBusy}
                        loading={removeMutation.isPending && removeMutation.variables === item.id}
                        onClick={() => removeMutation.mutate(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AssetLibraryPickerDialog
        visible={libraryPickerOpen}
        onClose={() => setLibraryPickerOpen(false)}
        title="Enlazar desde librería"
        description="Elige capturas organizadas por carpeta (PC, iPad, iOS). El copiloto CM las usará al generar posts."
        typeFilter={role === 'product-demo' ? 'video' : 'image'}
        isPending={linkMutation.isPending}
        onSelect={(asset) => linkMutation.mutate(asset.id)}
      />

      <AssetPreviewDialog
        asset={previewItem ? toPreviewAsset(previewItem) : null}
        onClose={() => setPreviewItem(null)}
        onDownload={(asset) => void handleDownloadPreview(asset)}
      />
    </div>
  );
}
