import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthenticatedAssetImage } from '@/components/assets/AuthenticatedAssetImage';
import { AuthenticatedAssetVideo } from '@/components/assets/AuthenticatedAssetVideo';
import { Button } from '@/components/atoms/Button';
import { IconButton, ACTION_BUTTON_GROUP_CLASS } from '@/components/atoms/IconButton';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import {
  parseImageGenerationMetadata,
  resolveContentVisualAssetIds,
  isVideoGeneration,
} from '@/lib/image-generation';
import {
  generateImageForContent,
  getImageGenerationByContentId,
  regenerateImageForContent,
} from '@/services/agents';
import { getApiErrorMessage } from '@/services/api';
import type { ImageGeneration } from '@/types/agents';

type ContentVisualPanelProps = {
  contentId: string;
  versionAssets?: unknown[];
};

export function ContentVisualPanel({ contentId, versionAssets }: ContentVisualPanelProps) {
  const queryClient = useQueryClient();

  const generationQuery = useQuery({
    queryKey: ['image-generation-by-content', contentId],
    queryFn: () => getImageGenerationByContentId(contentId),
    refetchInterval: (query) => {
      const generation = query.state.data?.generation;
      return generation?.status === 'processing' ? 3000 : false;
    },
  });

  const generation = generationQuery.data?.generation ?? null;
  const assetIds = resolveContentVisualAssetIds({ generation, versionAssets });
  const frameMeta = parseImageGenerationMetadata(generation?.metadata);
  const isVideo = isVideoGeneration(generation?.metadata);
  const frameCount = frameMeta ? frameMeta.frameCount ?? frameMeta.frames.length : 0;
  const hasVisual = assetIds.length > 0;
  const isProcessing = generation?.status === 'processing';
  const isFailed = generation?.status === 'failed';
  const isCompleted = generation?.status === 'completed' && hasVisual;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['image-generation-by-content', contentId] });
    void queryClient.invalidateQueries({ queryKey: ['image-generations'] });
    void queryClient.invalidateQueries({ queryKey: ['content', contentId] });
  };

  const generateMutation = useMutation({
    mutationFn: () => generateImageForContent(contentId),
    onSuccess: (result) => handleGenerationResult(result, invalidate),
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo generar la imagen')),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateImageForContent(contentId),
    onSuccess: (result) => handleGenerationResult(result, invalidate, true),
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo regenerar la imagen')),
  });

  return (
    <Card
      title="Imagen del contenido"
      subtitle={
        isVideo
          ? `Video · ${frameMeta?.duration ?? '?'}s`
          : frameCount > 1
            ? `${frameCount} frames · reel/carrusel`
            : 'Generada con Image Generator desde el copy'
      }
    >
      {generationQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando estado…
        </div>
      ) : null}

      {isProcessing ? (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-4 text-sm text-[var(--foreground-muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Generando imagen con IA…
        </div>
      ) : null}

      {isFailed && generation?.errorMessage ? (
        <p className="mb-3 text-sm text-destructive">{generation.errorMessage}</p>
      ) : null}

      {hasVisual ? (
        <div
          className={
            assetIds.length > 1
              ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
              : 'mx-auto max-w-sm'
          }
        >
          {assetIds.map((assetId, index) => (
            <div
              key={assetId}
              className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]"
            >
              {assetIds.length > 1 ? (
                <p className="border-b border-[var(--border)] px-2 py-1 text-[10px] text-[var(--foreground-muted)]">
                  Frame {index + 1}
                </p>
              ) : null}
              <div className={isVideo ? '' : 'aspect-square'}>
                {isVideo ? (
                  <AuthenticatedAssetVideo
                    assetId={assetId}
                    title={`Video ${index + 1}`}
                    className="w-full rounded-none"
                    controls
                  />
                ) : (
                  <AuthenticatedAssetImage
                    assetId={assetId}
                    title={`Imagen ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : !isProcessing ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--border)] p-6 text-center">
          <p className="text-sm text-[var(--foreground-muted)]">
            Aún no hay imagen para esta pieza.
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {!hasVisual && !isProcessing ? (
          <Button
            className="gap-2"
            loading={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            <Sparkles className="h-4 w-4" />
            Generar imagen
          </Button>
        ) : null}

        {isFailed ? (
          <Button
            variant="outline"
            className="gap-2"
            loading={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
        ) : null}

        {isCompleted && generation ? (
          <>
            <Link to={`/agents/image-generator/${generation.id}`}>
              <Button variant="outline" className="gap-2">
                <Eye className="h-4 w-4" />
                Ver detalle
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="gap-2"
              loading={regenerateMutation.isPending}
              onClick={() => regenerateMutation.mutate()}
            >
              <RefreshCw className="h-4 w-4" />
              Regenerar
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  );
}

type ContentVisualActionsProps = {
  contentId: string;
  generation?: ImageGeneration | null;
  versionAssets?: unknown[];
};

export function ContentVisualActions({
  contentId,
  generation: generationHint,
  versionAssets,
}: ContentVisualActionsProps) {
  const queryClient = useQueryClient();

  const generationQuery = useQuery({
    queryKey: ['image-generation-by-content', contentId],
    queryFn: () => getImageGenerationByContentId(contentId),
    staleTime: 30_000,
  });

  const generation = generationQuery.data?.generation ?? generationHint ?? null;
  const hasVisual = resolveContentVisualAssetIds({ generation, versionAssets }).length > 0;
  const isProcessing = generation?.status === 'processing';
  const isFailed = generation?.status === 'failed';

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['image-generation-by-content', contentId] });
    void queryClient.invalidateQueries({ queryKey: ['image-generations'] });
    void queryClient.invalidateQueries({ queryKey: ['contents'] });
  };

  const generateMutation = useMutation({
    mutationFn: () => generateImageForContent(contentId),
    onSuccess: (result) => handleGenerationResult(result, invalidate),
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo generar la imagen')),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateImageForContent(contentId),
    onSuccess: (result) => handleGenerationResult(result, invalidate, true),
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo regenerar la imagen')),
  });

  const loading = generateMutation.isPending || regenerateMutation.isPending;

  if (isProcessing) {
    return (
      <div className={ACTION_BUTTON_GROUP_CLASS}>
        <IconButton label="Generando imagen" disabled>
          <Loader2 className="animate-spin" />
        </IconButton>
      </div>
    );
  }

  if (hasVisual) {
    if (generation?.id) {
      return (
        <div className={ACTION_BUTTON_GROUP_CLASS}>
          <Link to={`/agents/image-generator/${generation.id}`}>
            <IconButton label="Ver imagen generada" variant="ghost">
              <Eye />
            </IconButton>
          </Link>
        </div>
      );
    }

    return (
      <div className={ACTION_BUTTON_GROUP_CLASS}>
        <Link to={`/contents/${contentId}`}>
          <IconButton label="Ver imagen en contenido" variant="ghost">
            <Eye />
          </IconButton>
        </Link>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className={ACTION_BUTTON_GROUP_CLASS}>
        <IconButton
          label="Reintentar generación"
          loading={loading}
          onClick={() => regenerateMutation.mutate()}
        >
          <RefreshCw />
        </IconButton>
      </div>
    );
  }

  return (
    <div className={ACTION_BUTTON_GROUP_CLASS}>
      <IconButton
        label="Generar imagen con IA"
        loading={loading}
        onClick={() => generateMutation.mutate()}
      >
        <Sparkles />
      </IconButton>
    </div>
  );
}

function handleGenerationResult(
  result: ImageGeneration,
  invalidate: () => void,
  regenerating = false,
) {
  invalidate();

  if (result.status === 'failed') {
    toast.error(result.errorMessage ?? 'Error al generar imagen');
    return;
  }

  if (result.status === 'processing') {
    toast.info(regenerating ? 'Regenerando imagen…' : 'Generando imagen…');
    return;
  }

  const meta = parseImageGenerationMetadata(result.metadata);
  toast.success(
    meta && (meta.frameCount ?? meta.frames.length) > 1
      ? `${meta.frameCount ?? meta.frames.length} imágenes generadas`
      : regenerating
        ? 'Imagen regenerada'
        : 'Imagen generada',
  );
}

export function buildContentGenerationMap(
  generations: ImageGeneration[],
): Map<string, ImageGeneration> {
  const map = new Map<string, ImageGeneration>();
  for (const item of generations) {
    if (!item.contentId || map.has(item.contentId)) {
      continue;
    }
    map.set(item.contentId, item);
  }
  return map;
}

export function contentHasVisual(input: {
  generation?: ImageGeneration | null;
  versionAssets?: unknown[];
}): boolean {
  return resolveContentVisualAssetIds({
    generation: input.generation,
    versionAssets: input.versionAssets,
  }).length > 0;
}
