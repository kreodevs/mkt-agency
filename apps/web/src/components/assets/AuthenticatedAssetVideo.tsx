import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/store/auth';

interface AuthenticatedAssetVideoProps {
  assetId: string;
  fallbackUrl?: string | null;
  title?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
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
  preload = 'metadata',
}: AuthenticatedAssetVideoProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      setFailed(false);
      setSrc(null);

      if (fallbackUrl?.startsWith('http')) {
        if (!cancelled) setSrc(fallbackUrl);
        return;
      }

      const token = getAccessToken();
      if (!token || !assetId) {
        if (!cancelled) setFailed(true);
        return;
      }

      try {
        const response = await fetch(`/api/v1/assets/${assetId}/file`, {
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
        if (!cancelled) setFailed(true);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [assetId, fallbackUrl]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--muted)]/40 text-xs text-[var(--foreground-muted)] ${className ?? ''}`}
        title={title ?? 'Video no disponible'}
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
    <video
      src={src}
      title={title}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline
      preload={preload}
    />
  );
}
