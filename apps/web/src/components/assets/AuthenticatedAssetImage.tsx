import { resolveAssetPreviewUrl } from '@/services/assets';

interface AuthenticatedAssetImageProps {
  assetId: string;
  fallbackUrl?: string | null;
  alt?: string;
  title?: string;
  className?: string;
  onError?: () => void;
}

export function AuthenticatedAssetImage({
  assetId,
  fallbackUrl,
  alt = '',
  title,
  className,
  onError,
}: AuthenticatedAssetImageProps) {
  const src =
    resolveAssetPreviewUrl({ id: assetId, url: fallbackUrl }) ??
    (fallbackUrl?.startsWith('http') ? fallbackUrl : null);

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
