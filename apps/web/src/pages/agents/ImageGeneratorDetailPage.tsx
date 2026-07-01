import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthenticatedAssetImage } from '@/components/assets/AuthenticatedAssetImage';
import { ApprovalActions } from '@/components/content/ApprovalActions';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { PageHeader } from '@/components/molecules/PageHeader';
import { toast } from '@/components/molecules/Sonner';
import { listGenerationAssetIds, parseImageGenerationMetadata } from '@/lib/image-generation';
import {
  deleteImageGeneration,
  getImageGeneration,
  retryImageGeneration,
} from '@/services/agents';
import { getContent } from '@/services/content';

export default function ImageGeneratorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const generationQuery = useQuery({
    queryKey: ['image-generation', id],
    queryFn: () => getImageGeneration(id!),
    enabled: Boolean(id),
  });

  const generation = generationQuery.data;
  const frames = generation ? listGenerationAssetIds(generation) : [];
  const metadata = parseImageGenerationMetadata(generation?.metadata);
  const frameCount = metadata ? metadata.frameCount ?? metadata.frames.length : 0;

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
      } else {
        toast.success(
          frameCount > 1 ? `${frameCount} frames generados` : 'Imagen generada',
        );
      }
      void queryClient.invalidateQueries({ queryKey: ['image-generation', id] });
      void queryClient.invalidateQueries({ queryKey: ['image-generations'] });
    },
    onError: () => toast.error('Error al reintentar'),
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
          frameCount > 1
            ? `Secuencia tipo reel · ${frameCount} frames`
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

        {generation.status === 'completed' && frames.length > 0 ? (
          <Card
            title={frames.length > 1 ? 'Frames del carrusel' : 'Imagen'}
            subtitle={
              frames.length > 1
                ? 'Cada frame es una imagen independiente para tu reel o carrusel'
                : undefined
            }
          >
            <div
              className={
                frames.length > 1
                  ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'mx-auto max-w-xl'
              }
            >
              {frames.map((assetId, index) => (
                <div key={assetId} className="overflow-hidden rounded-xl border border-[var(--border)]">
                  {frames.length > 1 && (
                    <p className="border-b border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground-muted)]">
                      Frame {index + 1}
                    </p>
                  )}
                  <div className="aspect-square bg-[var(--background-secondary)]">
                    <AuthenticatedAssetImage
                      assetId={assetId}
                      title={`Frame ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

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
