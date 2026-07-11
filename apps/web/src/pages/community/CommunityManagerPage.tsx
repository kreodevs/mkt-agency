import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Bookmark, MessageSquare, Sparkles } from 'lucide-react';
import { CommunityManagerPrerequisites } from '@/components/community/CommunityManagerPrerequisites';
import { ProductContextBanner } from '@/components/products/ProductContextBanner';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { EmptyState } from '@/components/molecules/EmptyState';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { apiFetch } from '@/services/api';
import {
  getCommunityManagerPreferences,
  getCommunityManagerReadiness,
  generateSocialCopy,
  saveCommunityManagerPreferences,
  type CmPlatform,
  type GenerateSocialCopyResponse,
} from '@/services/community-manager';
import { listProducts } from '@/services/products';
import { useResolvedProductId } from '@/hooks/useResolvedProductId';
import { CmGeneratorForm } from './CmGeneratorForm';
import { CmPostCard } from './CmPostCard';
import type { Batch, TonePreset } from './community-manager.types';

export default function CommunityManagerPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const productIdFromUrl = searchParams.get('productId');
  const resolvedProductId = useResolvedProductId();
  const [platforms, setPlatforms] = useState<CmPlatform[]>(['instagram', 'linkedin']);
  const [productId, setProductId] = useState('');
  const [count, setCount] = useState(3);
  const [tone, setTone] = useState('');
  const [topics, setTopics] = useState('');
  const [savePresetName, setSavePresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);

  const preferencesQuery = useQuery({
    queryKey: ['cm-preferences'],
    queryFn: getCommunityManagerPreferences,
  });

  const readinessQuery = useQuery({
    queryKey: ['cm-readiness'],
    queryFn: getCommunityManagerReadiness,
  });

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => listProducts({ status: 'active', limit: 100 }),
  });

  useEffect(() => {
    const items = productsQuery.data?.items ?? [];
    if (productIdFromUrl) {
      setProductId(productIdFromUrl);
      return;
    }
    if (resolvedProductId) {
      setProductId(resolvedProductId);
      return;
    }
    if (!productId && items.length > 0) {
      const primary = items.find((p) => p.isPrimary) ?? items[0];
      setProductId(primary.id);
    }
  }, [productsQuery.data, productId, productIdFromUrl, resolvedProductId]);

  useEffect(() => {
    if (!preferencesQuery.data || prefsReady) return;
    setPlatforms(preferencesQuery.data.platforms);
    setCount(preferencesQuery.data.count);
    setPrefsReady(true);
  }, [preferencesQuery.data, prefsReady]);

  const savePreferencesMutation = useMutation({
    mutationFn: saveCommunityManagerPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['cm-preferences'], data);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudieron guardar las preferencias');
    },
  });

  const persistPreferences = (nextPlatforms: CmPlatform[], nextCount: number) => {
    savePreferencesMutation.mutate({ platforms: nextPlatforms, count: nextCount });
  };

  const batchesQuery = useQuery({
    queryKey: ['cm-batches'],
    queryFn: () => apiFetch<Batch[]>('/community-manager/batches'),
  });

  const generateMutation = useMutation({
    mutationFn: (): Promise<GenerateSocialCopyResponse> =>
      generateSocialCopy({
        platforms,
        count,
        productId: productId || undefined,
        tone: tone.trim() || undefined,
        topics:
          topics
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean) || undefined,
      }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['cm-batches'] });
      void queryClient.invalidateQueries({ queryKey: ['contents'] });
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      void queryClient.invalidateQueries({ queryKey: ['calendar-day'] });

      const count = result.postsGenerated ?? 0;
      if (count > 0) {
        toast.success(
          `${count} post${count === 1 ? '' : 's'} creado${count === 1 ? '' : 's'} — revisa Contenidos y Calendario`,
        );
      }
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ['cm-batches'] });
      toast.error(error instanceof ApiError ? error.message : 'Error al generar copy');
    },
  });

  const handleGenerate = () => {
    if (!productId) {
      toast.message('Selecciona un producto antes de generar');
      return;
    }
    if (platforms.length === 0) {
      toast.message('Activa al menos una plataforma');
      return;
    }
    generateMutation.mutate();
  };

  const togglePlatform = (platform: CmPlatform) => {
    setPlatforms((prev) => {
      const next = prev.includes(platform)
        ? prev.filter((item) => item !== platform)
        : [...prev, platform];
      if (next.length === 0) {
        toast.message('Debes mantener al menos una plataforma activa');
        return prev;
      }
      persistPreferences(next, count);
      return next;
    });
  };

  const handleCountChange = (nextCount: number) => {
    setCount(nextCount);
    persistPreferences(platforms, nextCount);
  };

  const tonePresetsQuery = useQuery({
    queryKey: ['tone-presets'],
    queryFn: () => apiFetch<TonePreset[]>('/community-manager/tone-presets'),
  });

  const saveToneMutation = useMutation({
    mutationFn: (name: string) =>
      apiFetch<TonePreset>('/community-manager/tone-presets', {
        method: 'POST',
        body: JSON.stringify({ name, toneText: tone.trim() }),
      }),
    onSuccess: () => {
      toast.success('Tono guardado como plantilla');
      setShowSavePreset(false);
      setSavePresetName('');
      void queryClient.invalidateQueries({ queryKey: ['tone-presets'] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al guardar');
    },
  });

  const latestBatch = batchesQuery.data?.[0];

  return (
    <DashboardShell navigationOverride={tenantNavigation}>
      <PageHeader
        title="Community Manager"
        description="Genera copy manual por red y formato. Para la semana completa, usa Inicio → Preparar mi semana."
      />

      <Card className="mb-6 border-[var(--primary)]/30 bg-[var(--primary)]/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">Recomendado</p>
            <p className="text-sm text-[var(--foreground-muted)]">
              Deja que el copiloto prepare competidores, estrategia y posts en un solo paso.
            </p>
          </div>
          <Link to="/">
            <Button type="button" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Ir a Preparar mi semana
            </Button>
          </Link>
        </div>
      </Card>

      {productId && (
        <ProductContextBanner
          productId={productId}
          productName={productsQuery.data?.items.find((p) => p.id === productId)?.name}
        />
      )}

      {readinessQuery.data && readinessQuery.data.completed < readinessQuery.data.total && (
        <div className="mb-6">
          <CommunityManagerPrerequisites readiness={readinessQuery.data} />
        </div>
      )}

      <CmGeneratorForm
        platforms={platforms}
        onTogglePlatform={togglePlatform}
        count={count}
        onCountChange={handleCountChange}
        tone={tone}
        onToneChange={setTone}
        topics={topics}
        onTopicsChange={setTopics}
        productId={productId}
        onProductIdChange={setProductId}
        products={productsQuery.data?.items ?? []}
        onGenerate={handleGenerate}
        isGenerating={generateMutation.isPending}
        isSavingPreferences={savePreferencesMutation.isPending}
        tonePresets={tonePresetsQuery.data ?? []}
        onSavePreset={(name) => saveToneMutation.mutate(name)}
      />

      {batchesQuery.isLoading ? (
        <div className="py-12 text-center text-[var(--foreground-muted)]">Cargando...</div>
      ) : !latestBatch ? (
        <Card>
          <EmptyState
            compact
            icon={MessageSquare}
            title="Sin contenido generado aún"
            description="Selecciona plataformas y genera tu primer batch de copy para redes sociales."
          />
        </Card>
      ) : latestBatch.status === 'failed' || latestBatch.posts.length === 0 ? (
        <Card title="Última generación fallida">
          <div className="space-y-3 py-4">
            <p className="text-sm text-[var(--foreground)]">
              {latestBatch.errorMessage ??
                'No se generaron publicaciones. Suele deberse a la configuración del proveedor LLM.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/admin/llm-settings">
                <Button type="button" variant="outline" size="sm">
                  Revisar Ajustes LLM
                </Button>
              </Link>
              <Button type="button" size="sm" onClick={handleGenerate} loading={generateMutation.isPending}>
                Reintentar
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card title="Guía de publicación" subtitle="En lenguaje de negocio">
            <p className="text-sm leading-relaxed text-[var(--foreground)]">
              {latestBatch.publishingGuide}
            </p>
          </Card>

          <Card title="Posts generados" subtitle={`${latestBatch.publishedCount} en Contenidos · ${latestBatch.posts.length} en batch`}>
            <div className="space-y-3">
              {latestBatch.posts.map((post) => (
                <CmPostCard key={post.id} post={post} />
              ))}
            </div>
          </Card>
        </div>
      )}

      {showSavePreset && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-[var(--foreground)]/40 p-[var(--spacing-md)]">
          <div className="w-full max-w-sm rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-[var(--spacing-lg)] shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Guardar tono</h3>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Dale un nombre a esta plantilla de tono
            </p>
            <input
              type="text"
              value={savePresetName}
              onChange={(e) => setSavePresetName(e.target.value)}
              placeholder="Ej. Tono profesional, Divertido, Formal..."
              className="mt-4 h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowSavePreset(false);
                  setSavePresetName('');
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (savePresetName.trim()) {
                    saveToneMutation.mutate(savePresetName.trim());
                  }
                }}
                loading={saveToneMutation.isPending}
                disabled={!savePresetName.trim()}
                className="gap-2"
              >
                <Bookmark className="h-4 w-4" />
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
