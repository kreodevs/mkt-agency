import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/store/auth';
import { resolveAssetPreviewUrl } from '@/services/assets';
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
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      setFailed(false);
      setSrc(null);

      const httpFallback =
        resolveAssetPreviewUrl(
          { id: assetId, url: fallbackUrl, thumbnailUrl },
          { variant, preferHttpFallback: true },
        );

      if (httpFallback) {
        if (!cancelled) setSrc(httpFallback);
        return;
      }

      const token = getAccessToken();
      if (!token || !assetId) {
        if (!cancelled) setFailed(true);
        return;
      }

      const segment = variant === 'thumb' ? 'thumbnail' : 'file';

      try {
        const response = await fetch(`/api/v1/assets/${assetId}/${segment}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(`Asset fetch failed (${response.status})`);
        }
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setSrc(objectUrl);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
          onError?.();
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [assetId, variant, fallbackUrl, thumbnailUrl, onError]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--muted)]/40 text-xs text-[var(--foreground-muted)] ${className ?? ''}`}
        title={title ?? 'Retrato no disponible'}
      >
        No disponible
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--muted)]/20 ${className ?? ''}`}
        title={title}
      >
        <Loader2 className="h-5 w-5 animate-spin text-[var(--foreground-muted)]" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      title={title}
      className={className}
      loading="lazy"
      onError={() => {
        setFailed(true);
        onError?.();
      }}
    />
  );
}

export function getAuthenticatedAssetImageSrc(
  assetId: string,
  _variant: AssetUrlVariant = 'thumb',
): string | null {
  return assetId ? `/api/v1/assets/${assetId}/file` : null;
}
