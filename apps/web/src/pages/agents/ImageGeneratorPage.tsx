import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ImageIcon, Loader2, Sparkles, Trash2, RotateCcw, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import { listImageGenerations, generateImage, deleteImageGeneration, retryImageGeneration } from '@/services/agents';
import { ApiError } from '@/services/api';
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
    onSuccess: () => {
      toast.success('Imagen generada');
      setPrompt('');
      historyQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al generar imagen');
    },
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
                <div key={img.id} className="overflow-hidden rounded-xl border border-[var(--border)]">
                  <div className="flex aspect-square items-center justify-center bg-[var(--background-secondary)]">
                    {img.imageUrl ? (
                      <img
                        src={img.imageUrl}
                        alt={img.prompt}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : img.status === 'processing' ? (
                      <Loader2 className="h-8 w-8 animate-spin text-[var(--foreground-muted)]" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-sm text-[var(--foreground-muted)]">
                        <ImageIcon className="h-8 w-8" />
                        {img.status === 'failed' ? 'Error' : 'Sin imagen'}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-[var(--border)] p-3">
                    <p className="line-clamp-2 text-xs text-[var(--foreground)]">{img.prompt}</p>
                    <p className="mt-1 text-[10px] text-[var(--foreground-subtle)]">
                      {new Date(img.createdAt).toLocaleString('es-MX')}
                    </p>
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
