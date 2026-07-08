import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Dialog } from '@/components/molecules/Dialog';
import { AuthenticatedAssetImage } from '@/components/assets/AuthenticatedAssetImage';
import { AuthenticatedAssetVideo } from '@/components/assets/AuthenticatedAssetVideo';
import { isPdfAsset } from '@/components/assets/AssetThumbnail';
import { getAssetFileUrl } from '@/services/assets';
import { ASSET_TYPE_LABELS, type Asset } from '@/types/assets';

type AssetPreviewDialogProps = {
  asset: Asset | null;
  onClose: () => void;
  onDownload: (asset: Asset) => void;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssetPreviewDialog({ asset, onClose, onDownload }: AssetPreviewDialogProps) {
  const src = asset ? getAssetFileUrl(asset.id) : null;

  return (
    <Dialog
      visible={!!asset}
      onHide={onClose}
      title={asset?.name ?? 'Vista previa'}
      description={
        asset
          ? `${ASSET_TYPE_LABELS[asset.type]} · ${formatSize(asset.fileSize)}`
          : undefined
      }
      size="full"
      footer={
        asset ? (
          <Button type="button" variant="secondary" className="gap-2" onClick={() => onDownload(asset)}>
            <Download className="h-4 w-4" />
            Descargar
          </Button>
        ) : undefined
      }
    >
      {asset && (
        <div className="flex min-h-[50vh] max-h-[75vh] items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--background-secondary)]">
          {asset.type === 'image' ? (
            <AuthenticatedAssetImage
              assetId={asset.id}
              fallbackUrl={asset.url}
              thumbnailUrl={asset.thumbnailUrl}
              variant="full"
              title={asset.name}
              className="max-h-[75vh] max-w-full object-contain"
            />
          ) : asset.type === 'video' || asset.mimeType?.startsWith('video/') ? (
            <AuthenticatedAssetVideo
              assetId={asset.id}
              fallbackUrl={asset.url}
              title={asset.name}
              className="max-h-[75vh] max-w-full"
              controls
              autoPlay
            />
          ) : asset.type === 'audio' || asset.mimeType?.startsWith('audio/') ? (
            src ? (
              <audio src={src} controls autoPlay className="w-full max-w-lg" />
            ) : (
              <p className="text-sm text-[var(--foreground-muted)]">No se pudo cargar el audio.</p>
            )
          ) : isPdfAsset(asset) && src ? (
            <iframe
              src={src}
              title={asset.name}
              className="h-[75vh] w-full rounded-[var(--radius-md)] border-0 bg-white"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <FileText className="h-12 w-12 text-[var(--foreground-muted)]" />
              <p className="text-sm text-[var(--foreground-muted)]">
                Vista previa no disponible para este tipo de archivo.
              </p>
              <Button type="button" onClick={() => onDownload(asset)}>
                Descargar archivo
              </Button>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
