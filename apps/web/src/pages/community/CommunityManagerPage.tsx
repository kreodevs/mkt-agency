import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
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
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { apiFetch } from '@/services/api';

interface SocialPost {
  id: string;
  platform: string;
  title: string;
  body: string;
  hashtags: string[];
  visualDescription: string;
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

export default function CommunityManagerPage() {
  const queryClient = useQueryClient();
  const [platforms, setPlatforms] = useState<string[]>(['instagram', 'linkedin']);
  const [count, setCount] = useState(3);
  const [tone, setTone] = useState('');
  const [topics, setTopics] = useState('');
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  const batchesQuery = useQuery({
    queryKey: ['cm-batches'],
    queryFn: () => apiFetch<Batch[]>('/community-manager/batches'),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ id: string; status: string }>('/community-manager/generate', {
        method: 'POST',
        body: JSON.stringify({
          platforms,
          count,
          tone: tone.trim() || undefined,
          topics: topics
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean) || undefined,
        }),
      }),
    onSuccess: () => {
      toast.success('Copy generado — revisa los resultados');
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ['cm-batches'] });
      }, 2000);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al generar copy');
    },
  });

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  const latestBatch = batchesQuery.data?.[0];

  return (
    <DashboardShell navigationOverride={tenantNavigation}>
      <PageHeader
        title="Community Manager"
        description="Genera copy diario para redes sociales con IA"
      />

      {/* Generator form */}
      <Card className="mb-6">
        <div className="space-y-4">
          {/* Platform selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Plataformas
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PLATFORM_LABELS).map(([key, label]) => {
                const Icon = PLATFORM_ICONS[key] ?? Globe;
                const selected = platforms.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                      selected
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                        : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--foreground-subtle)]'
                    }`}
                    onClick={() => togglePlatform(key)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
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
                onChange={(e) => setCount(Number(e.target.value))}
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
              <input
                type="text"
                placeholder="Ej. Profesional, divertido, inspirador..."
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]"
              />
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
            onClick={() => generateMutation.mutate()}
            loading={generateMutation.isPending}
            disabled={platforms.length === 0}
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
      ) : (
        <div className="space-y-6">
          {/* Publishing guide */}
          <Card title="Guía de publicación" subtitle="En lenguaje de negocio">
            <p className="text-sm leading-relaxed text-[var(--foreground)]">
              {latestBatch.publishingGuide}
            </p>
          </Card>

          {/* Posts */}
          <Card title="Posts generados" subtitle={`${latestBatch.posts.length} publicaciones`}>
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
                          <p className="text-xs text-[var(--foreground)]">
                            {post.visualDescription}
                          </p>
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