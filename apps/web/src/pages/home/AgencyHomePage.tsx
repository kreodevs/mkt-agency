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
  Package,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import WebsiteAnalyzerFlow from '@/components/onboarding/WebsiteAnalyzerFlow';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/molecules/Card';
import { PageHeader } from '@/components/molecules/PageHeader';
import { StatsCard } from '@/components/molecules/StatsCard';
import { EmptyState } from '@/components/molecules/EmptyState';
import { StatusPill } from '@/components/atoms/StatusPill';
import { Button } from '@/components/atoms/Button';
import { apiFetch } from '@/services/api';
import { getCompanyProfile } from '@/services/company-profile';
import { HEALTH_UI, contentStatusToPill, type HealthKey } from '@/lib/semantic-ui';

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

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  in_review: 'En revisión',
  in_changes: 'En cambios',
};

const QUICK_ACTION_TONES = [
  'border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary)]',
  'border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]',
  'border-[var(--warning)]/20 bg-[var(--warning)]/10 text-[var(--warning)]',
  'border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]',
] as const;

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function resolveHealth(key?: string): (typeof HEALTH_UI)[HealthKey] {
  if (key === 'good' || key === 'poor') return HEALTH_UI[key];
  return HEALTH_UI.fair;
}

export default function AgencyHomePage() {
  const user = useAuthStore((s) => s.user);
  const isSuperadminNative = user?.isSuperadmin && !user?.impersonating;

  const homeQuery = useQuery({
    queryKey: ['agency-home'],
    queryFn: () => apiFetch<AgencyHomeData>('/dashboard/agency-home'),
    enabled: !isSuperadminNative,
  });

  const profileQuery = useQuery({
    queryKey: ['company-profile'],
    queryFn: getCompanyProfile,
    enabled: !isSuperadminNative,
  });

  const data = homeQuery.data;
  const profileCompleted = profileQuery.data?.status === 'completed';

  const homeData: AgencyHomeData = data ?? {
    upcoming: [],
    strategy: null,
    communityBatch: null,
    leads: { today: 0, total: 0, clients: 0, conversionRate: 0 },
  };

  const hasOnboarded = useMemo(() => {
    if (profileCompleted) {
      return true;
    }

    return Boolean(
      data &&
        (data.upcoming.length > 0 ||
          data.strategy ||
          data.communityBatch ||
          data.leads.total > 0),
    );
  }, [data, profileCompleted]);

  if (isSuperadminNative) {
    return (
      <DashboardShell>
        <PageHeader
          title="Administración"
          description="Panel de control de la plataforma"
        />
        <div className="grid gap-[var(--spacing-lg)] lg:grid-cols-2">
          <Card title="Organizaciones" subtitle="Tenants e impersonación">
            <p className="mb-[var(--spacing-md)] text-sm text-[var(--foreground-muted)]">
              Campañas, agentes IA y operativa de marketing se ejecutan impersonando un tenant
              desde el listado de organizaciones.
            </p>
            <Link to="/tenants">
              <Button>Ver listado de tenants</Button>
            </Link>
          </Card>
          <Card title="Configuración IA" subtitle="Modelos por tarea">
            <p className="mb-[var(--spacing-md)] text-sm text-[var(--foreground-muted)]">
              Asigna proveedor y modelo a cada tarea de IA. No ejecutes agentes desde aquí: eso
              ocurre en el contexto del tenant.
            </p>
            <Link to="/admin/llm-settings">
              <Button variant="outline">Configurar modelos por tarea</Button>
            </Link>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  if (homeQuery.isLoading || profileQuery.isLoading) {
    return (
      <DashboardShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-[var(--spacing-md)] text-4xl">🏢</div>
            <p className="text-[var(--foreground-muted)]">Cargando tu agencia...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (homeQuery.isError && !profileCompleted) {
    return (
      <DashboardShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card title="No se pudo cargar el inicio" subtitle="Error al conectar con el servidor">
            <p className="mb-[var(--spacing-md)] text-sm text-[var(--foreground-muted)]">
              Intenta de nuevo en unos segundos. Si el problema continúa, contacta soporte.
            </p>
            <Button type="button" onClick={() => void homeQuery.refetch()}>
              Reintentar
            </Button>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  if (!hasOnboarded) {
    return (
      <DashboardShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <WebsiteAnalyzerFlow />
        </div>
      </DashboardShell>
    );
  }

  const strategyHealth = resolveHealth(homeData.strategy?.overallHealth);

  return (
    <DashboardShell>
      <PageHeader
        title="Mi agencia"
        description="Escritorio de tu agencia de marketing IA"
      />
      {homeQuery.isError && (
        <p className="mb-[var(--spacing-md)] text-sm text-[var(--warning)]">
          Algunos datos no se pudieron cargar.{' '}
          <button
            type="button"
            className="font-medium text-[var(--primary)] underline"
            onClick={() => void homeQuery.refetch()}
          >
            Reintentar
          </button>
        </p>
      )}

      <div className="space-y-[var(--spacing-lg)]">
        <div className="grid gap-[var(--spacing-md)] sm:grid-cols-2 lg:grid-cols-4">
          <KpiWithLink
            title="Próximas publicaciones"
            value={homeData.upcoming.length}
            icon={<CalendarDays className="h-5 w-5" aria-hidden />}
            iconTone="accent"
            linkTo="/calendar"
            linkText="Ver calendario"
          />
          <KpiWithLink
            title="Leads hoy"
            value={homeData.leads.today}
            description={`${homeData.leads.total} total · ${homeData.leads.clients} clientes`}
            icon={<Users className="h-5 w-5" aria-hidden />}
            iconTone="primary"
            linkTo="/leads"
            linkText="Ver leads"
          />
          <KpiWithLink
            title="Tasa conversión"
            value={`${homeData.leads.conversionRate}%`}
            icon={<TrendingUp className="h-5 w-5" aria-hidden />}
            iconTone="success"
            linkTo="/"
            linkText="Ver dashboard"
          />
          <KpiWithLink
            title="Ajustes pendientes"
            value={homeData.strategy?.suggestionsCount ?? 0}
            icon={<Lightbulb className="h-5 w-5" aria-hidden />}
            iconTone="warning"
            linkTo="/strategy"
            linkText="Revisar"
          />
        </div>

        <div className="grid gap-[var(--spacing-lg)] lg:grid-cols-2">
          <Card title="Próximas publicaciones" subtitle="Contenido programado">
            {homeData.upcoming.length === 0 ? (
              <EmptyState
                compact
                title="Sin programación"
                description="Sin contenido programado. Genera copy en Community Manager."
              />
            ) : (
              <div className="space-y-[var(--spacing-sm)]">
                {homeData.upcoming.slice(0, 4).map((post) => (
                  <Link
                    key={post.id}
                    to={`/contents/${post.id}`}
                    className="block rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)] transition-colors hover:border-[var(--primary)]"
                  >
                    <div className="flex items-start justify-between gap-[var(--spacing-md)]">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          {post.title}
                        </p>
                        {post.preview && (
                          <p className="mt-[var(--spacing-xs)] line-clamp-2 text-xs text-[var(--foreground-muted)]">
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
                        <div className="mt-[var(--spacing-xs)] flex justify-end">
                          <StatusPill status={contentStatusToPill(post.status)} size="sm">
                            {getStatusLabel(post.status)}
                          </StatusPill>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {homeData.upcoming.length > 4 && (
                  <Link
                    to="/calendar"
                    className="flex items-center justify-center gap-1 pt-[var(--spacing-sm)] text-xs font-medium text-[var(--primary)] hover:underline"
                  >
                    Ver las {homeData.upcoming.length} programadas
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            )}
          </Card>

          <Card title="Estrategia" subtitle="Último análisis">
            {!homeData.strategy ? (
              <EmptyState
                compact
                title="Sin análisis"
                description="Sin análisis de estrategia aún. Genera uno en la sección Estrategia."
              />
            ) : (
              <div className="space-y-[var(--spacing-md)]">
                <div className="flex items-center gap-[var(--spacing-md)]">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] border ${strategyHealth.bg} ${strategyHealth.border}`}
                  >
                    <BarChart3 className={`h-6 w-6 ${strategyHealth.text}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Salud: {strategyHealth.label}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {new Date(homeData.strategy.createdAt).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {homeData.strategy.summary && (
                  <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                    {homeData.strategy.summary}
                  </p>
                )}

                {homeData.strategy.suggestionsCount > 0 && (
                  <Link
                    to="/strategy"
                    className={`flex items-center gap-[var(--spacing-sm)] rounded-[var(--radius-md)] border p-[var(--spacing-md)] text-sm font-medium transition-colors ${HEALTH_UI.fair.border} ${HEALTH_UI.fair.bg} ${HEALTH_UI.fair.text} hover:bg-[var(--warning)]/15`}
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {homeData.strategy.suggestionsCount} sugerencia(s) pendiente(s) de revisar
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </Link>
                )}
              </div>
            )}
          </Card>
        </div>

        <Card title="Acciones rápidas" subtitle="Lo que puedes hacer ahora">
          <div className="grid gap-[var(--spacing-md)] sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/products', icon: Package, title: 'Mis productos', desc: 'Catálogo y campañas' },
              { to: '/community', icon: MessageSquare, title: 'Community Manager', desc: 'Genera copy para redes' },
              { to: '/strategy', icon: Lightbulb, title: 'Analizar estrategia', desc: 'Revisa qué funciona' },
              { to: '/agents', icon: Sparkles, title: 'Agentes IA', desc: 'Brand Analyst + más' },
            ].map((action, index) => {
              const Icon = action.icon;
              const tone = QUICK_ACTION_TONES[index];
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center gap-[var(--spacing-md)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)] transition-colors hover:border-[var(--primary)]"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border ${tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{action.title}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">{action.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

function KpiWithLink({
  title,
  value,
  description,
  icon,
  iconTone,
  linkTo,
  linkText,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  iconTone: 'primary' | 'success' | 'warning' | 'accent';
  linkTo: string;
  linkText: string;
}) {
  return (
    <div className="space-y-[var(--spacing-sm)]">
      <StatsCard title={title} value={value} description={description} icon={icon} iconTone={iconTone} />
      <Link
        to={linkTo}
        className="flex items-center justify-center gap-1 rounded-[var(--radius-md)] border border-[var(--border)] py-[var(--spacing-xs)] text-xs font-medium text-[var(--foreground-muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
      >
        {linkText}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
