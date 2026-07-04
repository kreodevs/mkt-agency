import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, RefreshCw, RotateCcw, Trash2, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthenticatedAssetImage } from '@/components/assets/AuthenticatedAssetImage';
import { AuthenticatedAssetVideo } from '@/components/assets/AuthenticatedAssetVideo';
import { ApprovalActions } from '@/components/content/ApprovalActions';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { Dialog } from '@/components/molecules/Dialog';
import { PageHeader } from '@/components/molecules/PageHeader';
import { toast } from '@/components/molecules/Sonner';
import { listGenerationAssetIds, parseImageGenerationMetadata, isVideoGeneration } from '@/lib/image-generation';
import {
  deleteImageGeneration,
  getImageGeneration,
  regenerateImageGeneration,
  retryImageGeneration,
} from '@/services/agents';
import { getContent } from '@/services/content';

export default function ImageGeneratorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previewFrame, setPreviewFrame] = useState<{ assetId: string; index: number } | null>(
    null,
  );

  const generationQuery = useQuery({
    queryKey: ['image-generation', id],
    queryFn: () => getImageGeneration(id!),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      query.state.data?.status === 'processing' ? 3000 : false,
  });

  const generation = generationQuery.data;
  const frames = generation ? listGenerationAssetIds(generation) : [];
  const metadata = parseImageGenerationMetadata(generation?.metadata);
  const frameCount = metadata ? metadata.frameCount ?? metadata.frames.length : 0;
  const isVideo = isVideoGeneration(generation?.metadata);

  const contentQuery = useQuery({
    queryKey: ['content', generation?.contentId],
    queryFn: () => getContent(generation!.contentId!),
    enabled: Boolean(generation?.contentId),
  });

  const retryMutation = useMutation({
    mutationFn: () => retryImageGeneration(id!),
    onSuccess: (result) => {
      if (result.status === 'failed') {
        toast.error(result.errorMessage ?? 'Error al reintentar');
      } else if (result.status === 'processing') {
        toast.info('Generando en segundo plano…');
      } else {
        toast.success(
          frameCount > 1
            ? `${frameCount} frames generados`
            : isVideoGeneration(result.metadata)
              ? 'Video generado'
              : 'Imagen generada',
        );
      }
      void queryClient.invalidateQueries({ queryKey: ['image-generation', id] });
      void queryClient.invalidateQueries({ queryKey: ['image-generations'] });
    },
    onError: () => toast.error('Error al reintentar'),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateImageGeneration(id!),
    onSuccess: (result) => {
      if (result.status === 'failed') {
        toast.error(result.errorMessage ?? 'Error al regenerar');
      } else if (result.status === 'processing') {
        toast.info(
          frameCount > 1
            ? `Regenerando ${frameCount} frames en segundo plano…`
            : 'Regenerando en segundo plano…',
        );
      } else {
        const meta = parseImageGenerationMetadata(result.metadata);
        const count = meta ? meta.frameCount ?? meta.frames.length : 0;
        toast.success(
          count > 1
            ? `${count} frames regenerados`
            : meta?.mediaType === 'video'
              ? 'Video regenerado con branding actual'
              : 'Imagen regenerada con branding actual',
        );
      }
      void queryClient.invalidateQueries({ queryKey: ['image-generation', id] });
      void queryClient.invalidateQueries({ queryKey: ['image-generations'] });
      if (generation?.contentId) {
        void queryClient.invalidateQueries({
          queryKey: ['image-generation-by-content', generation.contentId],
        });
        void queryClient.invalidateQueries({ queryKey: ['content', generation.contentId] });
      }
    },
    onError: () => toast.error('Error al regenerar'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteImageGeneration(id!),
    onSuccess: () => {
      toast.success('Generación eliminada');
      void queryClient.invalidateQueries({ queryKey: ['image-generations'] });
      navigate('/agents/image-generator');
    },
    onError: () => toast.error('Error al eliminar'),
  });

  if (generationQuery.isLoading) {
    return (
      <DashboardShell navigationOverride={tenantNavigation}>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--foreground-muted)]" />
        </div>
      </DashboardShell>
    );
  }

  if (!generation) {
    return (
      <DashboardShell navigationOverride={tenantNavigation}>
        <PageHeader title="Generación no encontrada" />
        <Link to="/agents/image-generator">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al generador
          </Button>
        </Link>
      </DashboardShell>
    );
  }

  const currentVersion = contentQuery.data?.currentVersion;

  return (
    <DashboardShell navigationOverride={tenantNavigation}>
      <PageHeader
        title="Detalle de generación"
        description={
          isVideo
            ? `Video generado · ${metadata?.duration ?? '?'}s`
            : frameCount > 1
              ? `Secuencia tipo carrusel · ${frameCount} frames`
              : 'Imagen generada con IA'
        }
        actions={
          <Link to="/agents/image-generator">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Image Generator
            </Button>
          </Link>
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <Card title="Prompt" subtitle={new Date(generation.createdAt).toLocaleString('es-MX')}>
          <p className="whitespace-pre-wrap text-sm text-[var(--foreground)]">{generation.prompt}</p>
          {generation.status === 'failed' && generation.errorMessage && (
            <p className="mt-3 text-sm text-destructive">{generation.errorMessage}</p>
          )}
        </Card>

        {generation.status === 'processing' ? (
          <Card title="Generando">
            <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              {frameCount > 1
                ? `Generando ${frameCount} frames… puede tardar unos minutos.`
                : 'Generando imagen con IA…'}
            </div>
          </Card>
        ) : null}

        {generation.status === 'completed' && frames.length > 0 ? (
          <Card
            title={isVideo ? 'Video' : frames.length > 1 ? 'Frames del carrusel' : 'Imagen'}
            subtitle={
              isVideo
                ? 'Clip MP4 generado con OpenRouter Video API'
                : frames.length > 1
                  ? 'Cada frame es una imagen independiente para tu carrusel'
                  : undefined
            }
          >
            <div
              className={
                frames.length > 1 && !isVideo
                  ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'mx-auto max-w-xl'
              }
            >
              {frames.map((assetId, index) => (
                <div key={assetId} className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
                  {frames.length > 1 && !isVideo && (
                    <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-1.5">
                      <p className="text-xs font-medium text-[var(--foreground-muted)]">
                        Frame {index + 1}
                      </p>
                      {!isVideo && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                          onClick={() => setPreviewFrame({ assetId, index })}
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                          Ampliar
                        </button>
                      )}
                    </div>
                  )}
                  <div className={isVideo ? 'bg-[var(--background-secondary)]' : 'aspect-square bg-[var(--background-secondary)]'}>
                    {isVideo ? (
                      <AuthenticatedAssetVideo
                        assetId={assetId}
                        title="Video generado"
                        className="w-full"
                        controls
                      />
                    ) : (
                      <button
                        type="button"
                        className="block h-full w-full cursor-zoom-in"
                        onClick={() => setPreviewFrame({ assetId, index })}
                        aria-label={`Ampliar frame ${index + 1}`}
                      >
                        <AuthenticatedAssetImage
                          assetId={assetId}
                          title={`Frame ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <Dialog
          visible={previewFrame !== null}
          onHide={() => setPreviewFrame(null)}
          size="full"
          title={previewFrame ? `Frame ${previewFrame.index + 1}` : undefined}
          description="Vista ampliada del frame del carrusel"
        >
          {previewFrame ? (
            <div className="flex min-h-[50vh] items-center justify-center bg-[var(--background-secondary)] p-4">
              <AuthenticatedAssetImage
                assetId={previewFrame.assetId}
                title={`Frame ${previewFrame.index + 1}`}
                className="max-h-[80vh] w-full object-contain"
              />
            </div>
          ) : null}
        </Dialog>

        {generation.contentId && currentVersion && !currentVersion.signatureHash ? (
          <ApprovalActions contentId={generation.contentId} version={currentVersion} />
        ) : null}

        {generation.contentId ? (
          <Card title="Contenido vinculado">
            <p className="text-sm text-[var(--foreground-muted)]">
              Esta generación está asociada a una pieza del calendario editorial.
            </p>
            <div className="mt-3">
              <Link to={`/contents/${generation.contentId}`}>
                <Button variant="outline" size="sm">
                  Abrir contenido para editar y aprobar
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card title="Publicación">
            <p className="text-sm text-[var(--foreground-muted)]">
              Generación independiente del Image Generator. Para aprobar y programar, vincula la
              imagen desde el Community Manager o adjúntala manualmente en un contenido del
              calendario.
            </p>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          {generation.status === 'completed' && (
            <Button
              variant="outline"
              className="gap-2"
              loading={regenerateMutation.isPending}
              onClick={() => regenerateMutation.mutate()}
            >
              <RefreshCw className="h-4 w-4" />
              Regenerar
            </Button>
          )}
          {generation.status === 'failed' && (
            <Button
              variant="outline"
              className="gap-2"
              loading={retryMutation.isPending}
              onClick={() => retryMutation.mutate()}
            >
              <RotateCcw className="h-4 w-4" />
              Reintentar
            </Button>
          )}
          <Button
            variant="ghost"
            className="gap-2 text-destructive"
            loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
