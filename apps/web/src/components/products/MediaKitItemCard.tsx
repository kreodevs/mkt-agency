import { Eye, Film, ImageIcon, Trash2 } from 'lucide-react';
import type { ProductMediaKitItem, ProductMediaRole } from '@/types/product';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Select } from '@/components/atoms/Select';
import { StatusPill } from '@/components/atoms/StatusPill';
import { getAssetFileUrl } from '@/services/assets';
import { PRODUCT_MEDIA_ROLE_LABELS, PRODUCT_MEDIA_ROLES } from '@/types/product';

function isVideoMime(mimeType: string | null): boolean {
  return Boolean(mimeType?.startsWith('video/'));
}

interface MediaKitItemCardProps {
  item: ProductMediaKitItem;
  isBusy: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
  onRoleChange: (itemId: string, role: ProductMediaRole) => void;
  onLabelBlur: (itemId: string, label: string) => void;
  onPreview: (item: ProductMediaKitItem) => void;
  onRemove: (itemId: string) => void;
}

export function MediaKitItemCard({
  item,
  isBusy,
  isUpdating,
  isRemoving,
  onRoleChange,
  onLabelBlur,
  onPreview,
  onRemove,
}: MediaKitItemCardProps) {
  const previewUrl = getAssetFileUrl(item.assetId, 'thumb');
  const isVideo = isVideoMime(item.mimeType);

  return (
    <li className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)]">
      <button
        type="button"
        className="group relative flex aspect-video w-full cursor-zoom-in items-center justify-center bg-[var(--background-secondary)]"
        aria-label={`Ver ${item.label ?? item.assetName}`}
        onClick={() => onPreview(item)}
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
          onChange={(e) => onRoleChange(item.id, e.target.value as ProductMediaRole)}
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
          onBlur={(e) => onLabelBlur(item.id, e.target.value)}
        />

        <p className="truncate text-xs text-[var(--foreground-muted)]" title={item.assetName}>
          {item.assetName}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isBusy}
            onClick={() => onPreview(item)}
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
            loading={isRemoving}
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </Button>
        </div>

        {isUpdating && <p className="text-xs text-[var(--primary)]">Guardando...</p>}
      </div>
    </li>
  );
}
