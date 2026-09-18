import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getImageGenerationByContentId } from '@/services/agents';
import { getAssetDownloadUrl } from '@/services/assets';
import { slugifyForFilename } from '@/lib/content-platform';
import { isVideoGeneration, resolveContentVisualAssetIds } from '@/lib/image-generation';
import { toast } from '@/components/molecules/Sonner';

type UseContentAssetDownloadOptions = {
  contentId: string;
  title: string;
  versionAssets?: unknown[];
};

export function useContentAssetDownload({
  contentId,
  title,
  versionAssets,
}: UseContentAssetDownloadOptions) {
  const [downloadingAssetId, setDownloadingAssetId] = useState<string | null>(null);

  const generationQuery = useQuery({
    queryKey: ['image-generation-by-content', contentId],
    queryFn: () => getImageGenerationByContentId(contentId),
  });

  const generation = generationQuery.data?.generation ?? null;
  const assetIds = resolveContentVisualAssetIds({ generation, versionAssets });
  const isVideo = isVideoGeneration(generation?.metadata);
  const visualLabel = isVideo ? 'video' : assetIds.length > 1 ? 'carrusel' : 'imagen';
  const hasVisuals = assetIds.length > 0;
  const isDownloading = downloadingAssetId !== null;

  const downloadAsset = async (assetId: string, index: number) => {
    setDownloadingAssetId(assetId);
    try {
      const { url } = await getAssetDownloadUrl(assetId);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${slugifyForFilename(title)}-${visualLabel}-${index + 1}`;
      anchor.rel = 'noopener noreferrer';
      anchor.target = '_blank';
      anchor.click();
      toast.success('Descarga iniciada');
    } catch {
      toast.error('No se pudo descargar el archivo');
    } finally {
      setDownloadingAssetId(null);
    }
  };

  const downloadAllVisuals = async () => {
    for (let index = 0; index < assetIds.length; index += 1) {
      await downloadAsset(assetIds[index], index);
    }
  };

  const downloadLabel =
    assetIds.length === 1
      ? `Descargar ${isVideo ? 'video' : 'arte'}`
      : `Descargar ${assetIds.length} artes`;

  return {
    assetIds,
    hasVisuals,
    isVideo,
    isDownloading,
    downloadingAssetId,
    downloadLabel,
    downloadAsset,
    downloadAllVisuals,
    downloadFirstVisual: () => downloadAsset(assetIds[0], 0),
  };
}
