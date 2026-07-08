import { getAssetFileUrl, resolveAssetPreviewUrl } from '@/services/assets';
import type { AssetUrlVariant } from '@/types/assets';

interface AuthenticatedAssetImageProps {
  assetId: string;
  fallbackUrl?: string | null;
  thumbnailUrl?: string | null;
  variant?: AssetUrlVariant;
  alt?: string;
  title?: string;
  className?: string;
  onError?: () => void;
}

export function AuthenticatedAssetImage({
  assetId,
  fallbackUrl,
  thumbnailUrl,
  variant = 'thumb',
  alt = '',
  title,
  className,
  onError,
}: AuthenticatedAssetImageProps) {
  const src =
    resolveAssetPreviewUrl(
      { id: assetId, url: fallbackUrl, thumbnailUrl },
      { variant },
    ) ??
    (variant === 'full' && fallbackUrl?.startsWith('http') ? fallbackUrl : null);

  if (!src) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      title={title}
      className={className}
      loading="lazy"
      onError={onError}
    />
  );
}

export function getAuthenticatedAssetImageSrc(
  assetId: string,
  variant: AssetUrlVariant = 'thumb',
): string | null {
  return getAssetFileUrl(assetId, variant);
}
