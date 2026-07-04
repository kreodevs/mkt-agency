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
  isStaleImageGeneration,
} from '@/lib/image-generation';
import {
  generateImageForContent,
  getImageGenerationByContentId,
  regenerateImageForContent,
} from '@/services/agents';
import { getApiErrorMessage } from '@/services/api';
import {
  getDefaultFormatForPlatform,
  destinationPlatformLabel,
} from '@/lib/image-destination-formats';
import type { CmPlatform } from '@/services/community-manager';

import {
  CONTENT_VISUAL_FORMAT_LABELS,
  normalizeContentVisualFormat,
  type ContentVisualFormat,
} from '@/lib/visual-format';

import type { ImageGeneration } from '@/types/agents';

type ContentVisualPanelProps = {
  contentId: string;
  versionAssets?: unknown[];
  platform?: string | null;
  visualFormat?: ContentVisualFormat;
};

export function ContentVisualPanel({
  contentId,
  versionAssets,
  platform = null,
  visualFormat = 'image',
}: ContentVisualPanelProps) {
  const formatLabel = CONTENT_VISUAL_FORMAT_LABELS[normalizeContentVisualFormat(visualFormat)];
  const destinationFormat = getDefaultFormatForPlatform(platform as CmPlatform | null);
  const platformLabel = platform ? destinationPlatformLabel(platform as CmPlatform) : null;
  const queryClient = useQueryClient();

  const generationQuery = useQuery({
    queryKey: ['image-generation-by-content', contentId],
    queryFn: () => getImageGenerationByContentId(contentId),
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
  const assetIds = resolveContentVisualAssetIds({ generation, versionAssets });
  const frameMeta = parseImageGenerationMetadata(generation?.metadata);
  const isVideo = isVideoGeneration(generation?.metadata) || visualFormat === 'video';
  const frameCount = frameMeta ? frameMeta.frameCount ?? frameMeta.frames.length : 0;
  const hasVisual = assetIds.length > 0;
  const isStaleProcessing = generation ? isStaleImageGeneration(generation) : false;
  const processingAgeMs = generation?.updatedAt
    ? Date.now() - Date.parse(generation.updatedAt)
    : 0;
  const showForceRetry =
    generation?.status === 'processing' &&
    !isStaleProcessing &&
    Number.isFinite(processingAgeMs) &&
    processingAgeMs > 5 * 60 * 1000;
  const isProcessing = generation?.status === 'processing' && !isStaleProcessing;
  const isFailed = generation?.status === 'failed' || isStaleProcessing;
  const isCompleted = generation?.status === 'completed' && hasVisual;
  const processingLabel =
    visualFormat === 'video'
      ? 'Generando video con IA…'
      : visualFormat === 'carousel'
        ? 'Generando carrusel con IA…'
        : 'Generando imagen con IA…';

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
      title={visualFormat === 'video' ? 'Video del contenido' : 'Imagen del contenido'}
      subtitle={
        platformLabel
          ? `Formato ${destinationFormat.label} · ${formatLabel} · ${destinationFormat.aspectLabel} (${platformLabel})`
          : isVideo
            ? `Video · ${frameMeta?.duration ?? '?'}s · ${formatLabel}`
            : frameCount > 1
              ? `${frameCount} frames · carrusel`
              : `Generado con Image Generator · ${formatLabel}`
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
          {processingLabel}
        </div>
      ) : null}

      {isFailed ? (
        <div className="mb-3 space-y-2">
          <p className="text-sm text-destructive">
            {generation?.errorMessage ??
              (isStaleProcessing
                ? 'La generación tardó demasiado o se interrumpió. Puedes reintentar.'
                : 'No se pudo generar el visual.')}
          </p>
          {generation?.updatedAt ? (
            <p className="text-xs text-[var(--foreground-muted)]">
              Último intento:{' '}
              {new Date(generation.updatedAt).toLocaleString('es-MX', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
              . Tras un redeploy del backend, pulsa <strong>Reintentar</strong> (refrescar la
              página no vuelve a generar).
            </p>
          ) : null}
          <p className="text-xs text-[var(--foreground-muted)]">
            El formato visual del editor es <strong>{formatLabel}</strong>. Regenerar usará ese
            tipo (imagen, video o carrusel), no palabras sueltas del copy.
          </p>
        </div>
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
              className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-secondary)]"
            >
              {assetIds.length > 1 ? (
                <p className="border-b border-[var(--border)] px-[var(--spacing-sm)] py-[var(--spacing-xs)] text-xs text-[var(--foreground-muted)]">
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
        <div className="flex flex-col items-center gap-[var(--spacing-sm)] rounded-[var(--radius-md)] border border-dashed border-[var(--border)] p-[var(--spacing-lg)] text-center">
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
            {visualFormat === 'video'
              ? 'Generar video'
              : visualFormat === 'carousel'
                ? 'Generar carrusel'
                : 'Generar imagen'}
          </Button>
        ) : null}

        {isFailed || showForceRetry ? (
          <Button
            variant="outline"
            className="gap-2"
            loading={regenerateMutation.isPending}
            onClick={() => regenerateMutation.mutate()}
          >
            <RefreshCw className="h-4 w-4" />
            {showForceRetry && !isFailed ? 'Forzar reintento' : 'Reintentar'}
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
  const isStaleProcessing = generation ? isStaleImageGeneration(generation) : false;
  const isProcessing = generation?.status === 'processing' && !isStaleProcessing;
  const isFailed = generation?.status === 'failed' || isStaleProcessing;

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
    toast.info(
      regenerating
        ? 'Regenerando en segundo plano… puedes salir de esta página.'
        : 'Generando en segundo plano… puedes salir de esta página.',
    );
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
