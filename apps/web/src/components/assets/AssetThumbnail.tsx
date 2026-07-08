import { FileAudio, FileText, ImageIcon } from 'lucide-react';
import { AuthenticatedAssetImage } from '@/components/assets/AuthenticatedAssetImage';
import { AuthenticatedAssetVideo } from '@/components/assets/AuthenticatedAssetVideo';
import { ASSET_TYPE_LABELS, type Asset } from '@/types/assets';

function isPdfAsset(asset: Asset): boolean {
  return (
    asset.mimeType === 'application/pdf' || asset.name.toLowerCase().endsWith('.pdf')
  );
}

export function AssetThumbnail({ asset }: { asset: Asset }) {
  if (asset.type === 'image') {
    return (
      <div className="aspect-square overflow-hidden rounded-lg bg-[var(--background-secondary)]">
        <AuthenticatedAssetImage
          assetId={asset.id}
          fallbackUrl={asset.url}
          title={asset.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
    );
  }

  if (asset.type === 'video' || asset.mimeType?.startsWith('video/')) {
    return (
      <div className="aspect-square overflow-hidden rounded-lg bg-[var(--background-secondary)]">
        <AuthenticatedAssetVideo
          assetId={asset.id}
          fallbackUrl={asset.url}
          title={asset.name}
          className="h-full w-full object-cover"
          controls={false}
          muted
          preload="metadata"
        />
      </div>
    );
  }

  if (asset.type === 'audio' || asset.mimeType?.startsWith('audio/')) {
    return (
      <div className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg bg-[var(--background-secondary)]">
        <FileAudio className="h-8 w-8 text-[var(--primary)]" />
        <span className="text-[10px] font-medium text-[var(--foreground-muted)]">
          {ASSET_TYPE_LABELS.audio}
        </span>
      </div>
    );
  }

  if (asset.type === 'document' || isPdfAsset(asset)) {
    return (
      <div className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg bg-[var(--background-secondary)]">
        <FileText className="h-8 w-8 text-[var(--primary)]" />
        <span className="text-[10px] font-medium text-[var(--foreground-muted)]">
          {isPdfAsset(asset) ? 'PDF' : ASSET_TYPE_LABELS.document}
        </span>
      </div>
    );
  }

  return (
    <div className="flex aspect-square items-center justify-center rounded-lg bg-[var(--background-secondary)]">
      <div className="flex flex-col items-center gap-1 text-[var(--foreground-muted)]">
        <ImageIcon className="h-8 w-8" />
        <span className="text-[10px] font-medium">{ASSET_TYPE_LABELS[asset.type]}</span>
      </div>
    </div>
  );
}

export { isPdfAsset };
