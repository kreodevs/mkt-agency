import { getAssetFileUrl } from '@/services/assets';

interface AuthenticatedAssetVideoProps {
  assetId: string;
  fallbackUrl?: string | null;
  title?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export function AuthenticatedAssetVideo({
  assetId,
  fallbackUrl,
  title,
  className,
  controls = true,
  autoPlay = false,
  loop = false,
  muted = false,
}: AuthenticatedAssetVideoProps) {
  const src =
    getAssetFileUrl(assetId) ??
    (fallbackUrl?.startsWith('http') ? fallbackUrl : null);

  if (!src) {
    return null;
  }

  return (
    <video
      src={src}
      title={title}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline
      preload="metadata"
    />
  );
}
