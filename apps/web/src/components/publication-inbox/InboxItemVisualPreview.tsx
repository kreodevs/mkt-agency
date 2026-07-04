import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, Loader2, Video } from 'lucide-react';
import { AuthenticatedAssetImage } from '@/components/assets/AuthenticatedAssetImage';
import { AuthenticatedAssetVideo } from '@/components/assets/AuthenticatedAssetVideo';
import { SocialPostMockup } from '@/components/publication-inbox/SocialPostMockup';
import { getImageGenerationByContentId } from '@/services/agents';
import {
  isStaleImageGeneration,
  isVideoGeneration,
  resolveContentVisualAssetIds,
} from '@/lib/image-generation';
import { normalizeContentVisualFormat } from '@/lib/visual-format';
import type { PublicationInboxItem } from '@/types/publication-inbox';

interface InboxItemVisualPreviewProps {
  item: PublicationInboxItem;
  variant?: 'card' | 'detail';
}

export function InboxItemVisualPreview({ item, variant = 'card' }: InboxItemVisualPreviewProps) {
  const queryClient = useQueryClient();
  const versionAssets = item.assets ?? [];

  const generationQuery = useQuery({
    queryKey: ['image-generation-by-content', item.contentId],
    queryFn: () => getImageGenerationByContentId(item.contentId),
    staleTime: 5_000,
    refetchInterval: (query) => {
      const generation = query.state.data?.generation;
      if (!generation || generation.status !== 'processing') {
        return false;
      }
      if (isStaleImageGeneration(generation)) {
        return false;
      }
      return 3000;
    },
  });

  const generation = generationQuery.data?.generation ?? null;
  const visualFormat = normalizeContentVisualFormat(item.visualFormat);
  const assetIds = resolveContentVisualAssetIds({
    generation,
    versionAssets,
  });
  const isVideo = isVideoGeneration(generation?.metadata) || visualFormat === 'video';
  const isStaleProcessing = generation ? isStaleImageGeneration(generation) : false;
  const isProcessing = generation?.status === 'processing' && !isStaleProcessing;
  const isFailed = generation?.status === 'failed' || isStaleProcessing;

  useEffect(() => {
    if (generation?.status !== 'completed') {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
  }, [generation?.status, queryClient]);

  const isDetail = variant === 'detail';
  const imageMaxClass = isDetail ? 'max-h-[min(70vh,32rem)]' : 'max-h-56';
  const processingLabel =
    visualFormat === 'video' ? 'Generando video…' : 'Generando imagen…';

  if (generationQuery.isLoading && assetIds.length === 0) {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Cargando visual…
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-xs text-[var(--foreground-muted)]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {processingLabel}
      </div>
    );
  }

  if (assetIds.length > 0) {
    const previewIds = assetIds.slice(0, visualFormat === 'carousel' ? 3 : 1);

    return (
      <div className="mt-3">
        <SocialPostMockup platform={item.platform}>
          <div
            className={
              previewIds.length > 1
                ? 'grid grid-cols-3 gap-2'
                : isVideo
                  ? ''
                  : `aspect-video ${imageMaxClass} bg-[var(--background-secondary)]`
            }
          >
            {previewIds.map((assetId, index) => (
              <div
                key={assetId}
                className={
                  previewIds.length > 1
                    ? 'aspect-square overflow-hidden rounded-md'
                    : 'h-full w-full'
                }
              >
                {isVideo ? (
                  <AuthenticatedAssetVideo
                    assetId={assetId}
                    title={item.title}
                    className={`${imageMaxClass} w-full rounded-lg`}
                    controls
                  />
                ) : (
                  <AuthenticatedAssetImage
                    assetId={assetId}
                    alt={item.title}
                    title={item.title}
                    className="h-full w-full object-cover"
                  />
                )}
                {previewIds.length > 1 && (
                  <span className="sr-only">Frame {index + 1}</span>
                )}
              </div>
            ))}
          </div>
        </SocialPostMockup>
        {assetIds.length > previewIds.length && (
          <p className="mt-1 text-[10px] text-[var(--foreground-muted)]">
            +{assetIds.length - previewIds.length} frame(s) más en el editor
          </p>
        )}
      </div>
    );
  }

  if (isFailed) {
    return (
      <p className="mt-3 text-xs text-destructive">
        No se generó el visual. Ábrelo en el editor para reintentar.
      </p>
    );
  }

  if (visualFormat !== 'image' || item.type === 'social') {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-xs text-[var(--foreground-muted)]">
        {visualFormat === 'video' ? (
          <Video className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ImageIcon className="h-3.5 w-3.5 shrink-0" />
        )}
        Sin visual generado aún
      </div>
    );
  }

  return null;
}

export default InboxItemVisualPreview;
