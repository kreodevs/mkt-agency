import { useMutation, useQuery } from '@tanstack/react-query';
import { Eye, Film, FolderOpen, ImageIcon, Trash2, Upload } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
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
  updateProductMediaKitItem,
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
const FILTER_ALL = 'all' as const;
const MEDIA_KIT_RECOMMENDED_MIN_IMAGES = 3;

type RoleFilter = typeof FILTER_ALL | ProductMediaRole;

const MEDIA_KIT_SUMMARY_SEGMENTS: Array<{ role: ProductMediaRole; shortLabel: string }> = [
  { role: 'product-screenshot', shortLabel: 'capturas' },
  { role: 'event-photo', shortLabel: 'eventos' },
  { role: 'team-photo', shortLabel: 'equipo' },
  { role: 'product-demo', shortLabel: 'videos' },
  { role: 'testimonial', shortLabel: 'testimonios' },
  { role: 'b-roll', shortLabel: 'b-roll' },
  { role: 'other', shortLabel: 'otros' },
];

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
  const [uploadRole, setUploadRole] = useState<ProductMediaRole>('product-screenshot');
  const [filterRole, setFilterRole] = useState<RoleFilter>(FILTER_ALL);
  const [uploadLabel, setUploadLabel] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<ProductMediaKitItem | null>(null);

  const kitQuery = useQuery({
    queryKey: ['product-media-kit', productId],
    queryFn: () => listProductMediaKit(productId),
    enabled: Boolean(productId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadProductMediaKit(productId, file, uploadRole, uploadLabel),
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

  const updateMutation = useMutation({
    mutationFn: ({
      itemId,
      role,
      label,
    }: {
      itemId: string;
      role?: ProductMediaRole;
      label?: string | null;
    }) => updateProductMediaKitItem(productId, itemId, { role, label }),
    onSuccess: () => {
      void kitQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo actualizar');
    },
  });

  const linkMutation = useMutation({
    mutationFn: (assetId: string) =>
      linkProductMediaKit(productId, {
        assetId,
        role: uploadRole,
        label: uploadLabel || undefined,
      }),
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
        setUploadLabel('');
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
    disabled ||
    uploadMutation.isPending ||
    removeMutation.isPending ||
    linkMutation.isPending ||
    updateMutation.isPending;
  const items = kitQuery.data?.items ?? [];

  const roleCounts = useMemo(() => {
    const counts = new Map<ProductMediaRole, number>();
    for (const role of PRODUCT_MEDIA_ROLES) {
      counts.set(role, 0);
    }
    for (const item of items) {
      counts.set(item.role, (counts.get(item.role) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filterRole === FILTER_ALL) {
      return items;
    }
    return items.filter((item) => item.role === filterRole);
  }, [filterRole, items]);

  const filterOptions = useMemo(
    () => [
      { value: FILTER_ALL, label: `Todos (${items.length})` },
      ...PRODUCT_MEDIA_ROLES.map((role) => ({
        value: role,
        label: `${PRODUCT_MEDIA_ROLE_LABELS[role]} (${roleCounts.get(role) ?? 0})`,
      })),
    ],
    [items.length, roleCounts],
  );

  const imageCount = useMemo(
    () =>
      items.filter(
        (item) => item.assetType === 'image' || item.mimeType?.startsWith('image/'),
      ).length,
    [items],
  );

  const summarySegments = useMemo(
    () =>
      MEDIA_KIT_SUMMARY_SEGMENTS.map((segment) => ({
        ...segment,
        count: roleCounts.get(segment.role) ?? 0,
      })),
    [roleCounts],
  );

  const handleDownloadPreview = async (asset: Asset) => {
    try {
      const { url } = await getAssetDownloadUrl(asset.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo descargar el archivo');
    }
  };

  const handleRoleChange = (item: ProductMediaKitItem, nextRole: ProductMediaRole) => {
    if (nextRole === item.role) {
      return;
    }
    updateMutation.mutate(
      { itemId: item.id, role: nextRole },
      {
        onSuccess: () => {
          toast.success('Rol actualizado');
        },
      },
    );
  };

  const handleLabelBlur = (item: ProductMediaKitItem, nextLabel: string) => {
    const trimmed = nextLabel.trim();
    const current = item.label?.trim() ?? '';
    if (trimmed === current) {
      return;
    }
    updateMutation.mutate(
      { itemId: item.id, label: trimmed || null },
      {
        onSuccess: () => {
          toast.message('Etiqueta actualizada');
        },
      },
    );
  };

  return (
    <div className="space-y-[var(--spacing-lg)]">
      {!kitQuery.isLoading && items.length > 0 && (
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
            {summarySegments.map((segment, index) => (
              <span key={segment.role} className="inline-flex items-center">
                {index > 0 && (
                  <span className="mx-1 text-[var(--foreground-muted)]" aria-hidden="true">
                    ·
                  </span>
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
                  onClick={() => setFilterRole(segment.role)}
                >
                  <span className="tabular-nums">{segment.count}</span>{' '}
                  <span className="text-[var(--foreground-muted)]">{segment.shortLabel}</span>
                </button>
              </span>
            ))}
          </p>

          {imageCount < MEDIA_KIT_RECOMMENDED_MIN_IMAGES && (
            <p className="mt-2 text-xs text-[var(--warning)]">
              Sube al menos {MEDIA_KIT_RECOMMENDED_MIN_IMAGES} imágenes ({imageCount}/
              {MEDIA_KIT_RECOMMENDED_MIN_IMAGES}) para diseños menos genéricos en el copiloto.
            </p>
          )}

          {filterRole !== FILTER_ALL && (
            <button
              type="button"
              className="mt-2 text-xs text-[var(--primary)] hover:underline"
              onClick={() => setFilterRole(FILTER_ALL)}
            >
              Ver todos los assets
            </button>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <Select
          label="Rol al subir"
          hint="Solo aplica a archivos nuevos (subida o desde librería)"
          value={uploadRole}
          disabled={isBusy}
          onChange={(e) => setUploadRole(e.target.value as ProductMediaRole)}
          options={PRODUCT_MEDIA_ROLES.map((value) => ({
            value,
            label: PRODUCT_MEDIA_ROLE_LABELS[value],
          }))}
        />

        <InputText
          label="Etiqueta al subir (opcional)"
          value={uploadLabel}
          disabled={isBusy}
          placeholder="Ej. Demo onboarding v2"
          onChange={(e) => setUploadLabel(e.target.value)}
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
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-sm font-medium text-[var(--foreground)]">
            Assets subidos
            {!kitQuery.isLoading && (
              <span className="ml-2 text-[var(--foreground-muted)]">
                ({filteredItems.length}
                {filterRole !== FILTER_ALL ? ` de ${items.length}` : ''})
              </span>
            )}
          </p>

          {items.length > 0 && (
            <div className="w-full sm:max-w-xs">
              <Select
                label="Filtrar por rol"
                value={filterRole}
                disabled={kitQuery.isLoading || isBusy}
                onChange={(e) => setFilterRole(e.target.value as RoleFilter)}
                options={filterOptions}
              />
            </div>
          )}
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
        ) : filteredItems.length === 0 ? (
          <EmptyState
            compact
            icon={ImageIcon}
            title="Ningún asset con este rol"
            description={`No hay archivos con rol «${PRODUCT_MEDIA_ROLE_LABELS[filterRole as ProductMediaRole]}». Cambia el filtro o sube nuevos archivos.`}
            action={{
              label: 'Ver todos',
              onClick: () => setFilterRole(FILTER_ALL),
            }}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const previewUrl = getAssetFileUrl(item.assetId, 'thumb');
              const isVideo = isVideoMime(item.mimeType);
              const isUpdatingThisItem =
                updateMutation.isPending && updateMutation.variables?.itemId === item.id;

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

                  <div className="space-y-2 p-3">
                    <Select
                      label="Rol"
                      value={item.role}
                      disabled={isBusy}
                      onChange={(e) =>
                        handleRoleChange(item, e.target.value as ProductMediaRole)
                      }
                      options={PRODUCT_MEDIA_ROLES.map((value) => ({
                        value,
                        label: PRODUCT_MEDIA_ROLE_LABELS[value],
                      }))}
                    />

                    <InputText
                      key={`label-${item.id}-${item.label ?? ''}`}
                      label="Etiqueta"
                      defaultValue={item.label ?? ''}
                      disabled={isBusy}
                      placeholder="Sin etiqueta"
                      onBlur={(e) => handleLabelBlur(item, e.target.value)}
                    />

                    <p
                      className="truncate text-xs text-[var(--foreground-muted)]"
                      title={item.assetName}
                    >
                      {item.assetName}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
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

                    {isUpdatingThisItem && (
                      <p className="text-xs text-[var(--primary)]">Guardando...</p>
                    )}
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
        typeFilter={uploadRole === 'product-demo' ? 'video' : 'image'}
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
