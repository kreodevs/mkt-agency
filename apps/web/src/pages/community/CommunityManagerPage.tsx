import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  Hash,
  ImageIcon,
  Instagram,
  Linkedin,
  MessageCircle,
  MessageSquare,
  Music2,
  Sparkles,
  Target,
  Twitter,
} from 'lucide-react';
import { CommunityManagerPrerequisites } from '@/components/community/CommunityManagerPrerequisites';
import { ProductContextBanner } from '@/components/products/ProductContextBanner';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
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
import { CONTENT_VISUAL_FORMAT_LABELS } from '@/lib/visual-format';

interface SocialPost {
  id: string;
  platform: string;
  title: string;
  body: string;
  hashtags: string[];
  visualDescription: string;
  visualFormat?: string;
  bestTime: string;
  targetAudience: string;
  callToAction: string;
  tone: string;
  contentId?: string;
}

interface Batch {
  id: string;
  summary: string;
  posts: SocialPost[];
  publishingGuide: string;
  generatedAt: string;
  createdAt: string;
  status: 'completed' | 'failed';
  errorMessage: string | null;
  publishedCount: number;
}

interface TonePreset {
  id: string;
  name: string;
  toneText: string;
  isDefault: boolean;
  createdAt: string;
}

const PLATFORM_ICONS: Record<string, React.FC<{ className?: string }>> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: MessageCircle,
  tiktok: Music2,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'text-pink-500 bg-pink-500/10',
  linkedin: 'text-blue-600 bg-blue-500/10',
  twitter: 'text-sky-500 bg-sky-500/10',
  facebook: 'text-blue-500 bg-blue-500/10',
  tiktok: 'text-rose-400 bg-rose-400/10',
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
  facebook: 'Facebook',
  tiktok: 'TikTok',
};

const PLATFORM_KEYS = Object.keys(PLATFORM_LABELS) as CmPlatform[];

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
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
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

  // Tone presets
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
        description="Genera copy para promocionar un producto concreto en redes sociales"
      />

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

      {/* Generator form */}
      <Card className="mb-6">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Producto a promocionar
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)]"
            >
              <option value="">Selecciona un producto</option>
              {(productsQuery.data?.items ?? []).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                  {product.isPrimary ? ' (principal)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Platform selector */}
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-medium text-[var(--foreground)]">Plataformas</label>
              <span className="text-xs text-[var(--foreground-subtle)]">
                {savePreferencesMutation.isPending
                  ? 'Guardando…'
                  : 'Se guardan al activar o desactivar'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_KEYS.map((key) => {
                const Icon = PLATFORM_ICONS[key] ?? Globe;
                const selected = platforms.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${selected ? 'Desactivar' : 'Activar'} ${PLATFORM_LABELS[key]}`}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                      selected
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                        : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--foreground-subtle)]'
                    }`}
                    onClick={() => togglePlatform(key)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {PLATFORM_LABELS[key]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Count */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Posts a generar
              </label>
              <select
                value={count}
                onChange={(e) => handleCountChange(Number(e.target.value))}
                className="h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)]"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'post' : 'posts'}
                  </option>
                ))}
              </select>
            </div>

            {/* Tone */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Tono (opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. Profesional, divertido, inspirador..."
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="h-10 flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]"
                />
                {tone.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setSavePresetName(tone.trim().slice(0, 40));
                      setShowSavePreset(true);
                    }}
                    className="flex h-10 shrink-0 items-center gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-2.5 text-xs font-medium text-[var(--foreground-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Tone presets dropdown */}
              {(tonePresetsQuery.data ?? []).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {(tonePresetsQuery.data ?? []).slice(0, 5).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setTone(preset.toneText)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        tone === preset.toneText
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)] ring-1 ring-[var(--primary)]'
                          : 'bg-[var(--secondary)] text-[var(--foreground-muted)] hover:bg-[var(--secondary)]/80'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Topics */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Temas (opcional)
              </label>
              <input
                type="text"
                placeholder="Separados por coma"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                className="h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]"
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            loading={generateMutation.isPending}
            disabled={platforms.length === 0 || !productId}
            className="w-full gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Generar copy para redes
          </Button>
        </div>
      </Card>

      {/* Results */}
      {batchesQuery.isLoading ? (
        <div className="py-12 text-center text-[var(--foreground-muted)]">Cargando...</div>
      ) : !latestBatch ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <MessageSquare className="h-12 w-12 text-[var(--foreground-muted)]" />
            <p className="text-lg font-semibold text-[var(--foreground)]">
              Sin contenido generado aún
            </p>
            <p className="text-sm text-[var(--foreground-muted)]">
              Selecciona plataformas y genera tu primer batch de copy para redes sociales.
            </p>
          </div>
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
          {/* Publishing guide */}
          <Card title="Guía de publicación" subtitle="En lenguaje de negocio">
            <p className="text-sm leading-relaxed text-[var(--foreground)]">
              {latestBatch.publishingGuide}
            </p>
          </Card>

          {/* Posts */}
          <Card title="Posts generados" subtitle={`${latestBatch.publishedCount} en Contenidos · ${latestBatch.posts.length} en batch`}>
            <div className="space-y-3">
              {latestBatch.posts.map((post) => {
                const Icon = PLATFORM_ICONS[post.platform] ?? Globe;
                const colorClass = PLATFORM_COLORS[post.platform] ?? 'text-gray-500 bg-gray-500/10';
                const expanded = expandedBatch === post.id;
                return (
                  <div
                    key={post.id}
                    className="rounded-xl border border-[var(--border)] transition-all hover:shadow-sm"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-[var(--foreground)]">
                                {PLATFORM_LABELS[post.platform] ?? post.platform}
                              </span>
                              <span className="text-xs text-[var(--foreground-subtle)]">
                                {post.targetAudience}
                              </span>
                            </div>
                            <p className="mt-1 font-medium text-[var(--foreground)]">
                              {post.title}
                            </p>
                          </div>
                        </div>

                        <a
                          href={`/contents/${post.contentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`shrink-0 ${
                            post.contentId
                              ? 'text-[var(--primary)] hover:underline'
                              : 'pointer-events-none text-[var(--foreground-subtle)]'
                          }`}
                        >
                          {post.contentId ? (
                            <span className="flex items-center gap-1 text-[10px] font-medium">
                              <CheckCircle2 className="h-3 w-3" />
                              En contenido
                            </span>
                          ) : (
                            <span className="text-[10px]">Sin guardar</span>
                          )}
                        </a>
                      </div>

                      <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
                        {post.body}
                      </div>

                      {post.hashtags.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-[var(--primary)]">
                          <Hash className="h-3 w-3" />
                          {post.hashtags.map((h, i) => (
                            <span key={i}>#{h}</span>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-3 border-t border-[var(--border)] pt-3 text-[11px] text-[var(--foreground-subtle)]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.bestTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {post.targetAudience}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] font-medium text-[var(--foreground-muted)]">
                          CTA: {post.callToAction}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="mt-2 flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
                        onClick={() => setExpandedBatch(expanded ? null : post.id)}
                      >
                        {expanded ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Ocultar descripción visual
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            Ver descripción visual
                          </>
                        )}
                      </button>

                      {expanded && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg bg-[var(--secondary)] p-3">
                          <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--foreground-muted)]" />
                          <div className="space-y-1">
                            {post.visualFormat ? (
                              <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--primary)]">
                                Formato:{' '}
                                {CONTENT_VISUAL_FORMAT_LABELS[
                                  post.visualFormat as keyof typeof CONTENT_VISUAL_FORMAT_LABELS
                                ] ?? post.visualFormat}
                              </p>
                            ) : null}
                            <p className="text-xs text-[var(--foreground)]">
                              {post.visualDescription}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Save tone preset dialog */}
      {showSavePreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
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

function Clock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}