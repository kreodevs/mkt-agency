import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ImageIcon, Loader2, Sparkles, Trash2, RotateCcw, RefreshCw, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import { AuthenticatedAssetImage } from '@/components/assets/AuthenticatedAssetImage';
import { AuthenticatedAssetVideo } from '@/components/assets/AuthenticatedAssetVideo';
import {
  listImageGenerations,
  generateImage,
  deleteImageGeneration,
  retryImageGeneration,
  regenerateImageGeneration,
} from '@/services/agents';
import { ApiError } from '@/services/api';
import { parseImageGenerationMetadata, isVideoGeneration } from '@/lib/image-generation';
import { InputText } from '@/components/atoms/InputText';
import { ProductContextBanner } from '@/components/products/ProductContextBanner';
import { useResolvedProductId } from '@/hooks/useResolvedProductId';

const STYLE_OPTIONS = [
  { label: 'Sin estilo', value: '' },
  { label: 'Moderno', value: 'modern minimal design' },
  { label: 'Profesional', value: 'corporate professional' },
  { label: 'Creativo', value: 'creative artistic' },
  { label: 'Ilustración', value: 'flat illustration vector' },
];

const SIZE_OPTIONS = [
  { label: 'Cuadrado (1024×1024)', value: '1024x1024' },
  { label: 'Horizontal (1792×1024)', value: '1792x1024' },
  { label: 'Vertical (1024×1792)', value: '1024x1792' },
];

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [size, setSize] = useState('1024x1024');
  const resolvedProductId = useResolvedProductId();
  const navigate = useNavigate();

  const historyQuery = useQuery({
    queryKey: ['image-generations'],
    queryFn: listImageGenerations,
    refetchInterval: (query) =>
      (query.state.data ?? []).some((item) => item.status === 'processing') ? 3000 : false,
  });

  const history = historyQuery.data ?? [];

  const generateMutation = useMutation({
    mutationFn: () =>
      generateImage({
        prompt: prompt.trim(),
        style: style || undefined,
        size,
        productId: resolvedProductId,
      }),
    onSuccess: (result) => {
      if (result.status === 'failed') {
        toast.error(result.errorMessage ?? 'Error al generar imagen');
      } else {
        const meta = parseImageGenerationMetadata(result.metadata);
        toast.success(
          meta && (meta.frameCount ?? meta.frames.length) > 1
            ? `${meta.frameCount ?? meta.frames.length} frames generados para reel/carrusel`
            : meta?.mediaType === 'video'
              ? 'Video generado'
              : 'Imagen generada',
        );
        setPrompt('');
      }
      historyQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al generar imagen');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteImageGeneration(id),
    onSuccess: () => {
      toast.success('Eliminada');
      historyQuery.refetch();
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => retryImageGeneration(id),
    onSuccess: (result) => {
      if (result.status === 'failed') {
        toast.error(result.errorMessage ?? 'Error al reintentar');
      } else if (result.status === 'processing') {
        toast.info('Generando en segundo plano…');
      } else {
        toast.success('Imagen generada');
      }
      historyQuery.refetch();
    },
    onError: () => toast.error('Error al reintentar'),
  });

  const regenerateMutation = useMutation({
    mutationFn: (id: string) => regenerateImageGeneration(id),
    onSuccess: (result) => {
      if (result.status === 'failed') {
        toast.error(result.errorMessage ?? 'Error al regenerar');
      } else if (result.status === 'processing') {
        const meta = parseImageGenerationMetadata(result.metadata);
        const count = meta ? meta.frameCount ?? meta.frames.length : 0;
        toast.info(count > 1 ? `Regenerando ${count} frames en segundo plano…` : 'Regenerando…');
      } else {
        const meta = parseImageGenerationMetadata(result.metadata);
        toast.success(
          meta && (meta.frameCount ?? meta.frames.length) > 1
            ? `${meta.frameCount ?? meta.frames.length} frames regenerados`
            : meta?.mediaType === 'video'
              ? 'Video regenerado con branding actual'
              : 'Imagen regenerada con branding actual',
        );
      }
      historyQuery.refetch();
    },
    onError: () => toast.error('Error al regenerar'),
  });

  return (
    <DashboardShell navigationOverride={tenantNavigation}>
      <PageHeader
        title="Image Generator"
        description="Genera imágenes para tus campañas con inteligencia artificial."
        actions={
          <Link to="/agents">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ChevronLeft className="h-4 w-4" />
              Agentes
            </Button>
          </Link>
        }
      />

      {resolvedProductId && <ProductContextBanner productId={resolvedProductId} />}

      <div className="mx-auto max-w-4xl space-y-6">
        {history.length > 0 && (
          <Card title="Imágenes generadas" subtitle="Historial">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((img) => (
                <div
                  key={img.id}
                  className="overflow-hidden rounded-xl border border-[var(--border)] transition-shadow hover:shadow-lg"
                  onClick={() => navigate(`/agents/image-generator/${img.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/agents/image-generator/${img.id}`);
                    }
                  }}
                >
                  <div className="flex aspect-square items-center justify-center bg-[var(--background-secondary)]">
                    {img.status === 'processing' ? (
                      <Loader2 className="h-8 w-8 animate-spin text-[var(--foreground-muted)]" />
                    ) : img.assetId ? (
                      isVideoGeneration(img.metadata) ? (
                        <AuthenticatedAssetVideo
                          assetId={img.assetId}
                          fallbackUrl={img.imageUrl}
                          title={img.prompt}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <AuthenticatedAssetImage
                          assetId={img.assetId}
                          fallbackUrl={img.imageUrl}
                          title={img.prompt}
                          className="h-full w-full object-cover"
                        />
                      )
                    ) : img.imageUrl?.startsWith('http') ? (
                      <img
                        src={img.imageUrl}
                        alt=""
                        title={img.prompt}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 px-3 text-center text-sm text-[var(--foreground-muted)]">
                        <ImageIcon className="h-8 w-8" />
                        {img.status === 'failed' ? 'Error' : 'Sin imagen'}
                        {img.status === 'failed' && img.errorMessage && (
                          <p className="line-clamp-3 text-[10px] text-destructive">{img.errorMessage}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-[var(--border)] p-3">
                    {(() => {
                      const meta = parseImageGenerationMetadata(img.metadata);
                      if (meta?.mediaType === 'video') {
                        return (
                          <span className="mb-1 inline-block rounded-full bg-[var(--background-secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--foreground-muted)]">
                            Video · {meta.duration ?? '?'}s
                          </span>
                        );
                      }
                      if (!meta || (meta.frameCount ?? meta.frames.length) <= 1) return null;
                      return (
                        <span className="mb-1 inline-block rounded-full bg-[var(--background-secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--foreground-muted)]">
                          {meta.frameCount ?? meta.frames.length} frames · reel
                        </span>
                      );
                    })()}
                    <p className="line-clamp-2 text-xs text-[var(--foreground)]">{img.prompt}</p>
                    <p className="mt-1 text-[10px] text-[var(--foreground-subtle)]">
                      {new Date(img.createdAt).toLocaleString('es-MX')}
                    </p>
                    <div className="mt-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/agents/image-generator/${img.id}`);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {img.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          title="Reintentar"
                          onClick={(e) => {
                            e.stopPropagation();
                            retryMutation.mutate(img.id);
                          }}
                          loading={retryMutation.isPending && retryMutation.variables === img.id}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {img.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          title="Regenerar con logo y branding actual"
                          onClick={(e) => {
                            e.stopPropagation();
                            regenerateMutation.mutate(img.id);
                          }}
                          loading={regenerateMutation.isPending && regenerateMutation.variables === img.id}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(img.id);
                        }}
                        loading={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card title={history.length > 0 ? 'Nueva imagen' : 'Generar imagen'}>
          <div className="space-y-4">
            <InputText
              label="Describe la imagen que necesitas"
              placeholder="Ej. Un logo moderno para agencia de marketing con colores azul y dorado..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              fullWidth
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Estilo</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)]"
                >
                  {STYLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Tamaño</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)]"
                >
                  {SIZE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              loading={generateMutation.isPending}
              disabled={!prompt.trim()}
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {history.length > 0 ? 'Generar otra imagen' : 'Generar imagen'}
            </Button>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
