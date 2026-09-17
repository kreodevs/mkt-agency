import { useMutation, useQuery } from '@tanstack/react-query';
import { FolderOpen, ImageIcon, Upload } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Select } from '@/components/atoms/Select';
import { EmptyState } from '@/components/molecules/EmptyState';
import { toast } from '@/components/molecules/Sonner';
import { AssetLibraryPickerDialog } from '@/components/assets/AssetLibraryPickerDialog';
import { AssetPreviewDialog } from '@/components/assets/AssetPreviewDialog';
import { getAssetDownloadUrl } from '@/services/assets';
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
import { MediaKitSummarySection } from './MediaKitSummarySection';
import { MediaKitDropZone } from './MediaKitDropZone';
import { MediaKitItemCard } from './MediaKitItemCard';

const ACCEPTED_MIME_PREFIXES = ['image/', 'video/'];
const FILTER_ALL = 'all' as const;
type RoleFilter = typeof FILTER_ALL | ProductMediaRole;

function isAcceptedFile(file: File): boolean {
  return ACCEPTED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix));
}

function toPreviewAsset(item: ProductMediaKitItem): Asset {
  const assetType: AssetType =
    item.assetType === 'video' || item.assetType === 'audio' || item.assetType === 'document' || item.assetType === 'other'
      ? item.assetType
      : 'image';
  return {
    id: item.assetId, tenantId: '', folderId: null,
    name: item.label ?? item.assetName, type: assetType, mimeType: item.mimeType,
    fileKey: '', fileSize: 0, url: item.url, thumbnailUrl: null, metadata: {},
    referenceCount: 0, isInUse: false, tags: [], createdAt: item.createdAt, updatedAt: item.createdAt,
  };
}

interface ProductMediaKitPanelProps {
  productId: string;
  productName: string;
  disabled?: boolean;
}

export function ProductMediaKitPanel({ productId, productName, disabled }: ProductMediaKitPanelProps) {
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
    onSuccess: () => { toast.message('Archivo eliminado del kit'); void kitQuery.refetch(); },
    onError: (error) => { toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, role, label }: { itemId: string; role?: ProductMediaRole; label?: string | null }) =>
      updateProductMediaKitItem(productId, itemId, { role, label }),
    onSuccess: () => { void kitQuery.refetch(); },
    onError: (error) => { toast.error(error instanceof ApiError ? error.message : 'No se pudo actualizar'); },
  });

  const linkMutation = useMutation({
    mutationFn: (assetId: string) =>
      linkProductMediaKit(productId, { assetId, role: uploadRole, label: uploadLabel || undefined }),
    onSuccess: () => { toast.success('Archivo enlazado desde la librería'); setLibraryPickerOpen(false); void kitQuery.refetch(); },
    onError: (error) => { toast.error(error instanceof ApiError ? error.message : 'No se pudo enlazar'); },
  });

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const accepted = files.filter(isAcceptedFile);
      if (!accepted.length) { toast.error('Solo se aceptan imágenes o videos'); return; }
      let uploaded = 0;
      for (const file of accepted) {
        try { await uploadMutation.mutateAsync(file); uploaded += 1; } catch { break; }
      }
      if (uploaded > 0) {
        toast.success(uploaded === 1 ? 'Archivo añadido al kit' : `${uploaded} archivos añadidos al kit`);
        setUploadLabel('');
        void kitQuery.refetch();
      }
    },
    [kitQuery, uploadMutation],
  );

  const isBusy = disabled || uploadMutation.isPending || removeMutation.isPending || linkMutation.isPending || updateMutation.isPending;
  const items = kitQuery.data?.items ?? [];

  const filterOptions = useMemo(
    () => [
      { value: FILTER_ALL, label: `Todos (${items.length})` },
      ...PRODUCT_MEDIA_ROLES.map((role) => ({
        value: role,
        label: `${PRODUCT_MEDIA_ROLE_LABELS[role]} (${items.filter((i) => i.role === role).length})`,
      })),
    ],
    [items],
  );

  const filteredItems = useMemo(
    () => (filterRole === FILTER_ALL ? items : items.filter((item) => item.role === filterRole)),
    [filterRole, items],
  );

  const handleDownloadPreview = async (asset: Asset) => {
    try {
      const { url } = await getAssetDownloadUrl(asset.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo descargar el archivo');
    }
  };

  const handleRoleChange = (itemId: string, nextRole: ProductMediaRole) => {
    updateMutation.mutate(
      { itemId, role: nextRole },
      { onSuccess: () => { toast.success('Rol actualizado'); } },
    );
  };

  const handleLabelBlur = (itemId: string, nextLabel: string) => {
    const trimmed = nextLabel.trim();
    updateMutation.mutate(
      { itemId, label: trimmed || null },
      { onSuccess: () => { toast.message('Etiqueta actualizada'); } },
    );
  };

  return (
    <div className="space-y-[var(--spacing-lg)]">
      {!kitQuery.isLoading && items.length > 0 && (
        <MediaKitSummarySection
          items={items}
          filterRole={filterRole}
          onFilterRole={(role) => setFilterRole(role)}
          onResetFilter={() => setFilterRole(FILTER_ALL)}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <Select
          label="Rol al subir"
          hint="Solo aplica a archivos nuevos (subida o desde librería)"
          value={uploadRole}
          disabled={isBusy}
          onChange={(e) => setUploadRole(e.target.value as ProductMediaRole)}
          options={PRODUCT_MEDIA_ROLES.map((value) => ({ value, label: PRODUCT_MEDIA_ROLE_LABELS[value] }))}
        />
        <InputText
          label="Etiqueta al subir (opcional)"
          value={uploadLabel}
          disabled={isBusy}
          placeholder="Ej. Demo onboarding v2"
          onChange={(e) => setUploadLabel(e.target.value)}
        />
        <Button type="button" variant="outline" size="sm" className="gap-2 sm:mb-0" disabled={isBusy} onClick={() => setLibraryPickerOpen(true)}>
          <FolderOpen className="h-4 w-4" />
          Desde librería
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-2 sm:mb-0" disabled={isBusy} loading={uploadMutation.isPending} onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Subir archivo
        </Button>
      </div>

      <MediaKitDropZone
        isDragOver={isDragOver}
        isBusy={isBusy}
        productName={productName}
        isUploading={uploadMutation.isPending}
        onFiles={uploadFiles}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragCounterRef.current += 1; setIsDragOver(true); }}
        onDragLeave={(e) => {
          e.preventDefault(); e.stopPropagation();
          dragCounterRef.current -= 1;
          if (dragCounterRef.current <= 0) { dragCounterRef.current = 0; setIsDragOver(false); }
        }}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation();
          dragCounterRef.current = 0;
          setIsDragOver(false);
          if (!isBusy) void uploadFiles(Array.from(e.dataTransfer.files));
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      />

      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-sm font-medium text-[var(--foreground)]">
            Assets subidos
            {!kitQuery.isLoading && (
              <span className="ml-2 text-[var(--foreground-muted)]">
                ({filteredItems.length}{filterRole !== FILTER_ALL ? ` de ${items.length}` : ''})
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
          <EmptyState compact icon={ImageIcon} title="Sin assets todavía"
            description="Sube capturas de la app, fotos de eventos o un video demo."
            action={{ label: 'Subir archivo', onClick: () => fileInputRef.current?.click() }}
          />
        ) : filteredItems.length === 0 ? (
          <EmptyState compact icon={ImageIcon} title="Ningún asset con este rol"
            description={`No hay archivos con rol «${PRODUCT_MEDIA_ROLE_LABELS[filterRole as ProductMediaRole]}».`}
            action={{ label: 'Ver todos', onClick: () => setFilterRole(FILTER_ALL) }}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <MediaKitItemCard
                key={item.id}
                item={item}
                isBusy={isBusy}
                isUpdating={updateMutation.isPending && updateMutation.variables?.itemId === item.id}
                isRemoving={removeMutation.isPending && removeMutation.variables === item.id}
                onRoleChange={(itemId, role) => handleRoleChange(itemId, role)}
                onLabelBlur={(itemId, label) => handleLabelBlur(itemId, label)}
                onPreview={setPreviewItem}
                onRemove={(itemId) => removeMutation.mutate(itemId)}
              />
            ))}
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
