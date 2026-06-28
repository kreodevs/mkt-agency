import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { PageHeader } from '@/components/molecules/PageHeader';
import { apiFetch } from '@/services/api';

interface UpcomingPost {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledDate: string | null;
  preview: string | null;
}

interface AgencyHomeData {
  upcoming: UpcomingPost[];
  strategy: {
    id: string;
    status: string;
    summary?: string;
    overallHealth?: string;
    suggestionsCount: number;
    createdAt: string;
  } | null;
  communityBatch: {
    id: string;
    postsCount: number;
    summary: string;
    createdAt: string;
  } | null;
  leads: {
    today: number;
    total: number;
    clients: number;
    conversionRate: number;
  };
}

const BG_STATUS: Record<string, string> = {
  draft: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-emerald-500/10 text-emerald-600',
  rejected: 'bg-red-500/10 text-red-600',
  in_review: 'bg-blue-500/10 text-blue-600',
};

const HEALTH_CONFIG: Record<string, { label: string; color: string }> = {
  good: { label: 'Bueno', color: 'text-emerald-500' },
  fair: { label: 'Estable', color: 'text-amber-500' },
  poor: { label: 'Crítico', color: 'text-red-500' },
};

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    in_review: 'En revisión',
    in_changes: 'En cambios',
  };
  return labels[status] ?? status;
}

export default function AgencyHomePage() {
  const homeQuery = useQuery({
    queryKey: ['agency-home'],
    queryFn: () => apiFetch<AgencyHomeData>('/dashboard/agency-home'),
  });

  const data = homeQuery.data;
  const user = useAuthStore((s) => s.user);

  const hasOnboarded = useMemo(() => {
    return data && (data.upcoming.length > 0 || data.strategy || data.communityBatch || data.leads.total > 0);
  }, [data]);

  // Superadmin with auto-created tenant — skip empty onboarding state
  const isSuperadminWithTenant = useMemo(() => {
    return user?.isSuperadmin && !user?.impersonating;
  }, [user]);

  if (homeQuery.isLoading) {
    return (
      <DashboardShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-4xl">🏢</div>
            <p className="text-[var(--foreground-muted)]">Cargando tu agencia...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // Superadmin with auto-created tenant — show dashboard (data may be null on error)
  if (isSuperadminWithTenant && !hasOnboarded) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <PageHeader
            title="Administración"
            description="Panel de control de la plataforma"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickKpiCard
              icon={Users}
              label="Leads hoy"
              value={data?.leads?.today ?? 0}
              color="text-blue-600"
              bg="bg-blue-500/10"
            />
            <QuickKpiCard
              icon={Lightbulb}
              label="Estrategia"
              value="Pendiente"
              color="text-amber-600"
              bg="bg-amber-500/10"
            />
            <QuickKpiCard
              icon={CalendarDays}
              label="Próximas publicaciones"
              value={data?.upcoming?.length ?? 0}
              color="text-violet-600"
              bg="bg-violet-500/10"
            />
          </div>
        </div>
      </DashboardShell>
    );
  }

  // Empty state - new user who hasn't onboarded
  if (!hasOnboarded) {
    return (
      <DashboardShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="mb-2 text-2xl font-black text-[var(--foreground)]">
              Tu agencia de marketing IA
            </h1>
            <p className="mb-8 text-sm text-[var(--foreground-muted)]">
              SOHO, autoempleados, pequeños negocios — esto es tu agencia de marketing
              con inteligencia artificial. Estrategia, contenido, imágenes y análisis
              sin pagar una agencia tradicional.
            </p>

            <div className="mb-8 grid gap-3 text-left">
              {[
                { icon: MessageSquare, text: 'Genera copy para redes sociales con IA' },
                { icon: Lightbulb, text: 'Estrategia automática que se ajusta sola' },
                { icon: Target, text: 'Competitor intel para saber qué hacen otros' },
                { icon: TrendingUp, text: 'Dashboard con métricas y diagnóstico' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)]">
                    <item.icon className="h-4 w-4 text-[var(--primary)]" />
                  </div>
                  <span className="text-sm text-[var(--foreground)]">{item.text}</span>
                </div>
              ))}
            </div>

            <Link to="/onboarding">
              <Button className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                Configurar mi agencia
              </Button>
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[var(--foreground)]">Mi agencia</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Escritorio de tu agencia de marketing IA
        </p>
      </div>

      <div className="space-y-6">
        {/* Row 1: Quick KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickKpiCard
            icon={CalendarDays}
            label="Próximas publicaciones"
            value={data!.upcoming.length}
            color="text-violet-600"
            bg="bg-violet-500/10"
            linkTo="/calendar"
            linkText="Ver calendario"
          />
          <QuickKpiCard
            icon={Users}
            label="Leads hoy"
            value={data!.leads.today}
            color="text-blue-600"
            bg="bg-blue-500/10"
            detail={`${data!.leads.total} total · ${data!.leads.clients} clientes`}
            linkTo="/leads"
            linkText="Ver leads"
          />
          <QuickKpiCard
            icon={TrendingUp}
            label="Tasa conversión"
            value={`${data!.leads.conversionRate}%`}
            color="text-emerald-600"
            bg="bg-emerald-500/10"
            linkTo="/"
            linkText="Ver dashboard"
          />
          <QuickKpiCard
            icon={Lightbulb}
            label="Ajustes pendientes"
            value={data!.strategy?.suggestionsCount ?? 0}
            color="text-amber-600"
            bg="bg-amber-500/10"
            linkTo="/strategy"
            linkText="Revisar"
          />
        </div>

        {/* Row 2: Next posts + Strategy summary */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming posts */}
          <Card title="Próximas publicaciones" subtitle="Contenido programado">
            {data!.upcoming.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--foreground-muted)]">
                Sin contenido programado. Genera copy en Community Manager.
              </div>
            ) : (
              <div className="space-y-2">
                {data!.upcoming.slice(0, 4).map((post) => (
                  <Link
                    key={post.id}
                    to={`/contents/${post.id}`}
                    className="block rounded-xl border border-[var(--border)] p-3 transition-all hover:border-[var(--primary)] hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          {post.title}
                        </p>
                        {post.preview && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-[var(--foreground-muted)]">
                            {post.preview}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-xs font-semibold text-[var(--foreground-muted)]">
                          {post.scheduledDate
                            ? new Date(post.scheduledDate).toLocaleDateString('es-MX', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })
                            : 'Sin fecha'}
                        </span>
                        <p
                          className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            BG_STATUS[post.status] ?? 'bg-[var(--secondary)] text-[var(--foreground-muted)]'
                          }`}
                        >
                          {getStatusLabel(post.status)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
                {data!.upcoming.length > 4 && (
                  <Link
                    to="/calendar"
                    className="flex items-center justify-center gap-1 pt-2 text-xs font-medium text-[var(--primary)] hover:underline"
                  >
                    Ver las {data!.upcoming.length} programadas
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            )}
          </Card>

          {/* Strategy summary */}
          <Card title="Estrategia" subtitle="Último análisis">
            {!data!.strategy ? (
              <div className="py-8 text-center text-sm text-[var(--foreground-muted)]">
                Sin análisis de estrategia aún. Genera uno en la sección Estrategia.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      data!.strategy.overallHealth === 'good'
                        ? 'bg-emerald-500/10'
                        : data!.strategy.overallHealth === 'poor'
                          ? 'bg-red-500/10'
                          : 'bg-amber-500/10'
                    }`}
                  >
                    <BarChart3
                      className={`h-6 w-6 ${
                        HEALTH_CONFIG[data!.strategy.overallHealth ?? 'fair']?.color ?? 'text-amber-500'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Salud: {HEALTH_CONFIG[data!.strategy.overallHealth ?? 'fair']?.label ?? 'Estable'}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {new Date(data!.strategy.createdAt).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {data!.strategy.summary && (
                  <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                    {data!.strategy.summary}
                  </p>
                )}

                {data!.strategy.suggestionsCount > 0 && (
                  <Link
                    to="/strategy"
                    className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/10"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {data!.strategy.suggestionsCount} sugerencia(s) pendiente(s) de revisar
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </Link>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Row 3: Quick actions */}
        <Card title="Acciones rápidas" subtitle="Lo que puedes hacer ahora">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/community"
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 transition-all hover:border-[var(--primary)] hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-500/10">
                <MessageSquare className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Community Manager</p>
                <p className="text-xs text-[var(--foreground-muted)]">Genera copy para redes</p>
              </div>
            </Link>
            <Link
              to="/strategy"
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 transition-all hover:border-[var(--primary)] hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <Lightbulb className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Analizar estrategia</p>
                <p className="text-xs text-[var(--foreground-muted)]">Revisa qué funciona</p>
              </div>
            </Link>
            <Link
              to="/agents"
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 transition-all hover:border-[var(--primary)] hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                <Sparkles className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Agentes IA</p>
                <p className="text-xs text-[var(--foreground-muted)]">Brand Analyst + más</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

function QuickKpiCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  detail,
  linkTo,
  linkText,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  detail?: string;
  linkTo?: string;
  linkText?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            {label}
          </p>
          <p className={`mt-0.5 text-2xl font-black ${color}`}>{value}</p>
          {detail && (
            <p className="mt-0.5 text-[10px] text-[var(--foreground-subtle)]">{detail}</p>
          )}
        </div>
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-[var(--border)] py-1.5 text-[11px] font-medium text-[var(--foreground-muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
        >
          {linkText}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}